/* The moving HV Reset Beta pass as a GIF, for pages outside the app (the admin's "send to all testers").
   Same card and motion as betaPassGif in index.html: the card tilts and the holographic foil and glare move.
   HVPassGif({name, no, since, back}, "/hv-reset/") -> Promise of base64 GIF */
(function () {
  var CSS = ".hvpg{position:fixed;left:-10000px;top:0;width:300px;pointer-events:none}" +
    ".hvpg .c{--mx:30%;--my:20%;position:relative;width:300px;aspect-ratio:300/440;border-radius:24px;overflow:hidden;color:#fff;font-family:'Atkinson Hyperlegible','Segoe UI',system-ui,sans-serif;background:linear-gradient(140deg,#1d2045 0%,#2e3270 44%,#181a3b 100%);box-shadow:0 0 0 1px rgba(255,255,255,.14) inset}" +
    ".hvpg .f{position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 22%,rgba(168,177,255,.55) 34%,rgba(240,163,200,.5) 42%,rgba(255,226,170,.45) 48%,rgba(155,231,220,.5) 55%,transparent 66%);background-size:220% 220%;background-position:var(--mx) var(--my);mix-blend-mode:color-dodge;opacity:.55}" +
    ".hvpg .l{position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 1px,transparent 1px 7px);mix-blend-mode:overlay}" +
    ".hvpg .g{position:absolute;inset:0;background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.55),rgba(255,255,255,.08) 28%,transparent 52%);mix-blend-mode:overlay;opacity:.8}" +
    ".hvpg .i{position:absolute;inset:0;padding:22px 22px 20px;display:flex;flex-direction:column}" +
    ".hvpg .t{display:flex;justify-content:space-between;align-items:center}.hvpg .b{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;letter-spacing:.16em}.hvpg .b img{width:22px;height:22px;border-radius:6px}" +
    ".hvpg .ch{width:42px;height:32px;border-radius:7px;background:linear-gradient(135deg,#f1dca6,#b8954f 60%,#e9cf8c);box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);display:grid;grid-template-rows:repeat(3,1fr);padding:5px 6px;gap:3px;box-sizing:border-box}.hvpg .ch i{border-top:1px solid rgba(80,60,20,.45)}" +
    ".hvpg .w{margin-top:auto;font-family:'Sora','Segoe UI',system-ui,sans-serif;font-weight:200;font-size:88px;letter-spacing:-.05em;line-height:.9;background:linear-gradient(180deg,#fff 20%,rgba(255,255,255,.42));-webkit-background-clip:text;background-clip:text;color:transparent}" +
    ".hvpg .m{display:flex;justify-content:space-between;gap:12px;margin-top:14px;font-size:10.5px;color:rgba(255,255,255,.6)}.hvpg .m .r{text-align:right}.hvpg .m small{display:block;font-size:10.5px;letter-spacing:.06em}" +
    ".hvpg .m b{display:block;margin-top:3px;font-size:13.5px;color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}" +
    ".hvpg .bd{position:absolute;right:18px;top:62px;padding:4px 9px;border-radius:99px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.14em}";
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var lib = function (base) {
    return window.htmlToImage ? Promise.resolve(window.htmlToImage) : new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = base + "vendor/html-to-image.js"; s.onload = function () { res(window.htmlToImage); }; s.onerror = rej; document.head.appendChild(s);
    });
  };
  window.HVPassGif = async function (x, base) {
    base = base || "/hv-reset/";
    if (!document.getElementById("hvpg-css")) { var st = document.createElement("style"); st.id = "hvpg-css"; st.textContent = CSS; document.head.appendChild(st); }
    var h = await lib(base), G = await import(base + "vendor/gifenc.esm.js");
    var w = document.createElement("div"); w.className = "hvpg";
    w.innerHTML = '<div class="c"><div class="f"></div><div class="l"></div><div class="g"></div><div class="i"><div class="t"><span class="b"><img src="' + base + 'icon.svg" alt="">HV RESET</span><span class="ch"><i></i><i></i><i></i></span></div>' +
      '<div class="w">Beta</div><div class="m"><div><small>Member</small><b>' + esc(x.name) + '</b></div><div class="r"><small>Tester no.</small><b>' + esc(x.no) + '</b></div></div>' +
      '<div class="m"><div><small>' + (x.back ? "First joined" : "Since") + '</small><b>' + esc(x.since) + '</b></div><div class="r"><small>Access</small><b>Labs</b></div></div></div>' + (x.back ? '<span class="bd">REJOINED</span>' : "") + "</div>";
    document.body.appendChild(w); var card = w.firstChild;
    try {
      var N = 18, W = 360, H = 500, out = document.createElement("canvas"); out.width = W; out.height = H;
      var ctx = out.getContext("2d", { willReadFrequently: true }), enc = G.GIFEncoder();
      for (var i = 0; i < N; i++) {
        var t = i / N, a = Math.sin(t * Math.PI * 2);
        card.style.setProperty("--mx", (50 + a * 45).toFixed(1) + "%"); card.style.setProperty("--my", (30 + Math.cos(t * Math.PI * 2) * 25).toFixed(1) + "%");
        var fr = await h.toCanvas(card, { pixelRatio: 1, cacheBust: i === 0 });
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
        var sx = 1 - Math.abs(a) * .07, ky = a * .05, cw2 = fr.width * sx;
        ctx.setTransform(sx, ky, 0, 1, (W - cw2) / 2, (H - fr.height) / 2 - ky * fr.width * .5);
        ctx.shadowColor = "rgba(20,18,60,.35)"; ctx.shadowBlur = 28; ctx.shadowOffsetY = 16; ctx.drawImage(fr, 0, 0); ctx.shadowColor = "transparent";
        var px = ctx.getImageData(0, 0, W, H).data, pal = G.quantize(px, 128), idx = G.applyPalette(px, pal);
        enc.writeFrame(idx, W, H, { palette: pal, delay: 90, repeat: 0 });
      }
      enc.finish(); var b = enc.bytes(), s = ""; for (var j = 0; j < b.length; j += 8192) s += String.fromCharCode.apply(null, b.subarray(j, j + 8192));
      return btoa(s);
    } finally { w.remove(); }
  };
})();
