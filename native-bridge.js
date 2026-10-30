/* HV Reset Android shell: native alarms (battery-saver safe) + native Google sign-in. No-op outside the app. */
(function () {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;

  // App-only polish (the website is unchanged): fits every Android screen size, keeps controls from overlapping
  document.documentElement.classList.add("hv-app");
  const st = document.createElement("style");
  st.textContent = [
    "html.hv-app{-webkit-text-size-adjust:100%;overscroll-behavior:none}",
    "html.hv-app *{-webkit-tap-highlight-color:transparent}",
    "html.hv-app button,html.hv-app .dashbtn,html.hv-app .h-dock,html.hv-app .accwrap{touch-action:manipulation;-webkit-user-select:none;user-select:none}",
    "html.hv-app .savepill{bottom:calc(88px + env(safe-area-inset-bottom,0px));left:16px;max-width:calc(100% - 32px);box-sizing:border-box}",
    "html.hv-app .toast{max-width:calc(100% - 32px);width:max-content;box-sizing:border-box;white-space:normal;text-align:center}",
    "html.hv-app:has(.toast.show) .savepill{opacity:0;pointer-events:none}",
    "html.hv-app .moon{left:5vw!important;top:64px!important;width:36px!important;height:36px!important}",
    "html.hv-app .ob-go{white-space:nowrap;flex:0 0 auto;padding-left:24px;padding-right:24px}",
    "html.hv-app .ob-nav{gap:8px}",
    "html.hv-app .ob-dots{gap:5px}",
    "@media (max-height:690px){html.hv-app .ob-watch{display:none}}",
    "@media (max-width:340px){html.hv-app .h-top{gap:6px}html.hv-app .h-dock{gap:6px;padding:6px}}"
  ].join("\n");
  document.head.appendChild(st);


  // Hide the launch splash (app icon on brand colour) as soon as the first screen has painted
  const SS = (C.Plugins || {}).SplashScreen;
  const hideSplash = () => { try { if (SS && SS.hide) SS.hide({ fadeOutDuration: 250 }); } catch (e) {} };
  if (document.readyState === "complete") requestAnimationFrame(() => setTimeout(hideSplash, 120));
  else window.addEventListener("load", () => requestAnimationFrame(() => setTimeout(hideSplash, 120)));

  // Smoothness: phones draw heavy glass blur and endless background motion slowly. Keep the look, cut the cost.
  const perf = document.createElement("style");
  perf.textContent = [
    "html.hv-app .o1,html.hv-app .o2,html.hv-app .o3,html.hv-app .stars,html.hv-app .halo,html.hv-app .halo2,html.hv-app .mist{animation:none!important}",
    "html.hv-app body.in-room .intro{filter:none!important}",
    "html.hv-app .drawer,html.hv-app #modal,html.hv-app .room,html.hv-app .hvai{will-change:transform}",
    "html.hv-app button:active,html.hv-app .pill:active,html.hv-app [role=button]:active{transform:scale(.96);transition:transform .08s ease-out}",
    "html.hv-app:root{transition:none!important}",
    "html.hv-vt *,html.hv-vt *::before,html.hv-vt *::after{transition:none!important}",
    "html.hv-app .quote{filter:none!important;transition:opacity .45s ease!important}",
    "::view-transition-old(root),::view-transition-new(root){animation-duration:.45s;animation-timing-function:ease}",
    "@keyframes hvpop{from{opacity:0;transform:translate3d(0,22px,0) scale(.985)}to{opacity:1;transform:none}}",
    "html.hv-app .modal{animation:hvpop .36s cubic-bezier(.22,1,.36,1)!important;filter:none!important}",
    "html.hv-app .scrim{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(8,12,28,.62)!important}",
    "html.hv-app *{scroll-behavior:auto}"
  ].join("\n");
  document.head.appendChild(perf);
  const lighten = () => {
    const out = [];
    const walk = (rules) => {
      for (const r of rules) {
        if (r.cssRules && !r.selectorText) { try { walk(r.cssRules); } catch (e) {} continue; }
        const v = r.style && (r.style.backdropFilter || r.style.webkitBackdropFilter);
        if (!v || !r.selectorText) continue;
        const m = /blur\((\d+(?:\.\d+)?)px\)/.exec(v);
        if (m && +m[1] > 14) out.push(r.selectorText + "{backdrop-filter:blur(14px) saturate(125%)!important;-webkit-backdrop-filter:blur(14px) saturate(125%)!important}");
      }
    };
    for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
    if (out.length) { const t = document.createElement("style"); t.textContent = out.join("\n"); document.head.appendChild(t); }
  };

  // Changing the look (time of day): the website blends ~17 colours for 2.4 s, which re-styles the whole page every frame.
  // In the app the change is instant and the screen cross-fades on the GPU instead.
  let pass = false;
  document.addEventListener("click", (e) => {
    if (pass) return;
    const b = e.target.closest && e.target.closest("[data-look]");
    if (!b || !document.startViewTransition) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const h = document.documentElement;
    h.classList.add("hv-vt");
    const vt = document.startViewTransition(() => { pass = true; try { b.click(); } finally { pass = false; } });
    const done = () => h.classList.remove("hv-vt");
    vt.finished.then(done, done);
    setTimeout(done, 1500);
  }, true);
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("button,[role=button],.pill") && navigator.vibrate) navigator.vibrate(8); }, true);
  if (document.readyState === "complete") lighten(); else window.addEventListener("load", lighten);
  const P = C.Plugins || {};
  const LN = P.LocalNotifications, SL = P.SocialLogin;
  const CHANNEL = "hv-reminders";
  const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (Math.abs(h) % 2000000000) + 1; };

  async function ensure() {
    if (!LN) return false;
    try {
      let p = await LN.checkPermissions();
      if (p.display !== "granted") p = await LN.requestPermissions();
      if (p.display !== "granted") return false;
      await LN.createChannel({ id: CHANNEL, name: "Task and timer reminders", importance: 5, visibility: 1, vibration: true });
      const ex = await LN.checkExactNotificationSetting();
      if (ex.exact_alarm !== "granted" && !localStorage.getItem("hv-exact-asked")) {
        localStorage.setItem("hv-exact-asked", "1");
        await LN.changeExactNotificationSetting(); // opens the "Alarms & reminders" setting
      }
      return true;
    } catch (e) { return false; }
  }

  let chain = Promise.resolve();
  window.hvNative = {
    // list: [{k, at(ms), title, body}] replaces every pending reminder
    set(list) {
      chain = chain.then(async () => {
        if (!(await ensure())) return;
        const pend = await LN.getPending();
        if (pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
        const items = list.filter((l) => l.at > Date.now() + 1000).slice(0, 40).map((l) => ({
          id: hash(l.k), title: l.title, body: l.body, channelId: CHANNEL,
          schedule: { at: new Date(l.at), allowWhileIdle: true }, smallIcon: "ic_stat_hv",
        }));
        if (items.length) { await LN.schedule({ notifications: items }); setTimeout(guide, 3500); }
      }).catch(() => {});
    },
    widget(o) { try { if (P.HVSettings) P.HVSettings.setWidget({ json: JSON.stringify(o) }).catch(() => {}); } catch (e) {} },
  };
  if (LN) LN.addListener("localNotificationActionPerformed", () => {});
  setTimeout(ensure, 2500);

  // One-time guide: phones like OnePlus, Xiaomi and Samsung stop background apps unless told not to

  // Android Back button: close the top-most popup, sheet or menu first, then go back a screen, then ask before leaving
  const AP = P.App;
  if (AP && AP.addListener) {
    let lastBack = 0;
    const q = (sel) => document.querySelector(sel);
    const esc = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const closeTop = () => {
      const x = q("#bhNote"); if (x) { x.remove(); return true; }
      if (q("#tpop")) { esc(); return true; }
      if (q(".hvai:not([hidden])")) { const b = q(".hvai:not([hidden]) .hvai-x"); if (b) { b.click(); return true; } }
      if (q("#bhub.open")) { const b = q("#bhub .bh-x"); if (b) { b.click(); return true; } }
      if (q("#dDrill.open") || q("#dash.in") || q("#scrim.open") || q("#drawer.open")) { esc(); return true; }
      if (document.body.classList.contains("in-room") && !document.body.classList.contains("timer-on")) { esc(); return true; }
      return false;
    };
    AP.addListener("backButton", () => {
      if (closeTop()) return;
      if (location.hash && history.length > 1) { history.back(); return; }
      const now = Date.now();
      if (now - lastBack < 2200) { AP.exitApp(); return; }
      lastBack = now;
      if (typeof window.toast === "function") window.toast("Press back again to exit");
    });
  }

  const HS = P.HVSettings;
  function guide() {
    try { if (localStorage.getItem("hv-batt-guide")) return; } catch (e) {}
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(10,12,30,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px;font-family:Sora,system-ui,sans-serif";
    el.innerHTML = '<div style="background:#1b1f3d;color:#fff;border-radius:22px;padding:22px 20px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
      + '<h3 style="margin:0 0 6px;font-size:19px">Make reminders reliable</h3>'
      + '<p style="margin:0 0 14px;color:#c4c8ee;font-size:14px;line-height:1.5">Your phone may stop HV Reset in the background and miss a reminder. Do these once:</p>'
      + '<ol style="margin:0 0 16px;padding-left:20px;color:#e8eaff;font-size:14px;line-height:1.7"><li>Open app settings, then Battery, choose <b>Unrestricted</b> (or Allow background activity)</li><li>Turn <b>Allow auto-launch</b> on, if you see it</li><li>Lock HV Reset in your recent apps</li></ol>'
      + '<button id="hvg-open" style="width:100%;padding:13px;border:0;border-radius:14px;background:linear-gradient(135deg,#5B86D6,#9C8BDA);color:#fff;font:600 15px inherit;font-family:inherit">Open settings</button>'
      + '<button id="hvg-skip" style="width:100%;padding:12px;border:0;background:none;color:#aab0e8;font:500 14px inherit;font-family:inherit;margin-top:6px">Done / Later</button></div>';
    document.body.appendChild(el);
    const close = () => { try { localStorage.setItem("hv-batt-guide", "1"); } catch (e) {} el.remove(); };
    el.querySelector("#hvg-skip").onclick = close;
    el.querySelector("#hvg-open").onclick = () => { if (HS) HS.openAppSettings().catch(() => {}); };
  }

  // Native Google sign-in -> Firebase credential (the web popup is blocked inside an app WebView)
  let inited = false;
  async function nativeSignIn() {
    const id = (window.HV_NATIVE || {}).googleWebClientId;
    if (!SL || !id) throw new Error("Google sign-in is not set up in this build yet.");
    if (!inited) { await SL.initialize({ google: { webClientId: id } }); inited = true; }
    const r = await SL.login({ provider: "google", options: {} });
    const tok = r && r.result && r.result.idToken;
    if (!tok) throw new Error("Google did not return a token.");
    const cred = window.firebase.auth.GoogleAuthProvider.credential(tok);
    await window.firebase.auth().signInWithCredential(cred);
    window.__hvaJustSignedIn = true;
  }
  const H = window.HVCloud;
  if (H) {
    const origOut = H.signOut && H.signOut.bind(H);
    H.signIn = nativeSignIn;
    H.signOut = async () => { try { if (SL && inited) await SL.logout({ provider: "google" }); } catch (e) {} if (origOut) return origOut(); };
  }
})();
