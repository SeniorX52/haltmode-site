// Counts haltmode.com's visits in daily totals, with no cookies, nothing saved on your device and nothing
// that identifies you. See https://haltmode.com/privacy/.
// - Each page view: the page, the website that linked here and the ?ref= tag of the link.
// - A visit from outside the site also adds 1 to the day's totals for its kind of device (Windows, Mac,
//   phone...), browser and language, and the server adds its country. Each is a separate total.
// - Clicks: Download, Buy and the demo video, reaching the prices, and a page that doesn't exist (404),
//   each counted once per page view.
// - The Buy buttons tell the checkout which page and source the purchase started from, for sales per source.
// Our own browsers: open any page with ?nocount once to be left out (?count to be counted again).
(function () {
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  try {
    if (q.has('nocount')) localStorage.setItem('halt_nocount', '1');
    if (q.has('count')) localStorage.removeItem('halt_nocount');
  } catch (e) {}

  // where this visitor came from; the beta sign-up form sends the same, so sign-ups can be counted per source
  var src = '', inside = false;
  try {
    if (document.referrer) {
      var h = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
      if (h === 'haltmode.com') inside = true; else src = h;
    }
  } catch (e) {}
  var tag = String(q.get('ref') || q.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  window.haltRef = { src: src, tag: tag };

  var mine = false;
  try { mine = localStorage.getItem('halt_nocount') === '1'; } catch (e) {}
  var site = location.hostname === 'haltmode.com';
  var live = site && !mine && !navigator.webdriver;
  var page = location.pathname;
  var server = 'https://halt-license.haltmode.workers.dev';

  function send(o) {
    if (!live) return;
    o.p = page; o.s = src; o.t = tag;
    var body = JSON.stringify(o), url = server + '/v1/hit';
    try {
      if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) fetch(url, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' });
    } catch (e) {}
  }
  var done = {};
  function once(e) { if (!done[e]) { done[e] = 1; send({ e: e }); } }

  function device() {
    var ua = navigator.userAgent || '', pf = String((navigator.userAgentData && navigator.userAgentData.platform) || '');
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';   // iPads say Macintosh
    if (/windows/i.test(pf) || /windows nt/i.test(ua)) return 'windows';
    if (/cros/i.test(ua)) return 'chromeos';
    if (/macintosh|mac os x/i.test(ua)) return 'mac';
    if (/linux/i.test(ua)) return 'linux';
    return 'other';
  }
  function browser() {
    var ua = navigator.userAgent || '';
    if (navigator.brave) return 'brave';                       // Brave looks like Chrome otherwise
    if (/edg(e|a|ios)?\//i.test(ua)) return 'edge';
    if (/opr\/|opera/i.test(ua)) return 'opera';
    if (/samsungbrowser/i.test(ua)) return 'samsung';
    if (/firefox|fxios/i.test(ua)) return 'firefox';
    if (/chrome|crios|chromium/i.test(ua)) return 'chrome';
    if (/safari/i.test(ua)) return 'safari';
    return 'other';
  }

  if (document.querySelector('meta[name="halt-404"]')) once('404');
  else if (inside) send({ v: 0 });
  else send({ v: 1, d: device(), b: browser(), l: String(navigator.language || '').toLowerCase().split('-')[0] });

  // the Buy buttons carry where this purchase started (or that it's one of ours, x=1, not counted)
  var buy = server + '/v1/buy';
  if (site) {
    var links = document.querySelectorAll('a[href^="' + buy + '"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.href = buy + '?' + (mine ? 'x=1' : 'p=' + encodeURIComponent(page) + (src ? '&s=' + encodeURIComponent(src) : '') + (tag ? '&t=' + tag : ''));
    }
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('#vidplay')) { once('video'); return; }
    var a = t.closest('a[href]');
    if (!a) return;
    var href = a.href || '';
    if (/\/releases\/.+\.exe$/i.test(href)) once('download');
    else if (href.indexOf(buy) === 0) once('buy');
    else if (/youtube\.com\/watch/i.test(href)) once('video');
  }, true);

  var prices = document.getElementById('pricing');
  if (prices && 'IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) {
      for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { once('pricing'); seen.disconnect(); }
    }, { threshold: 0.1 });
    seen.observe(prices);
  }
})();
