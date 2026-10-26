// Counts this page view in haltmode.com's daily visit totals: the page, the website that linked here and
// the ?ref= tag of the link. No cookies, nothing saved on your device, nothing that identifies you.
// See https://haltmode.com/privacy/. (Our own browsers: open any page with ?nocount once to be left out.)
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

  try { if (localStorage.getItem('halt_nocount') === '1') return; } catch (e) {}
  if (location.hostname !== 'haltmode.com' || navigator.webdriver) return;
  var url = 'https://halt-license.haltmode.workers.dev/v1/hit';
  var body = JSON.stringify({ p: location.pathname, s: src, t: tag, v: inside ? 0 : 1 });
  try {
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) fetch(url, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' });
  } catch (e) {}
})();
