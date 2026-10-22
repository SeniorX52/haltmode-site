// Phone menu. On narrow screens the header's links are hidden, so this adds a Menu button that opens
// them as a list. It copies the page's own links, so each page keeps a single list of links.
// The list closes when a link is chosen, on a tap outside it, or with Escape.
(function () {
  var links = document.querySelector('header.top .links');
  if (!links) return;
  var bar = links.parentElement;
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'menubtn';
  btn.setAttribute('aria-label', 'Menu'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var panel = document.createElement('nav');
  panel.className = 'menupanel'; panel.setAttribute('aria-label', 'Menu'); panel.hidden = true;
  panel.innerHTML = links.innerHTML;
  bar.appendChild(btn); bar.appendChild(panel);
  function set(open) { panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(panel.hidden); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  addEventListener('resize', function () { if (innerWidth > 820) set(false); });
})();
