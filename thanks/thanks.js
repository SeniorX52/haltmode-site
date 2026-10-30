// The thank-you page after buying: kept in its own file so the page can allow only scripts from haltmode.com
(function () {
  var q = new URLSearchParams(location.search), $ = function (id) { return document.getElementById(id); };
  function show(id) { ['wait', 'ok', 'slow', 'gone', 'fail'].forEach(function (x) { $(x).hidden = x !== id; }); }
  if (q.get('error')) { show('fail'); return; }
  var id = q.get('checkout_id') || '';
  if (!/^[0-9a-zA-Z_-]{8,64}$/.test(id)) { show('gone'); return; }
  if (q.get('app')) $('applead').hidden = false;
  var tries = 0;
  function ask() {
    tries++;
    fetch('https://halt-license.haltmode.workers.dev/v1/order?checkout_id=' + encodeURIComponent(id)).then(function (r) {
      if (r.status === 200) return r.json().then(function (j) { if (j.email) $('who').textContent = j.email; show('ok'); });
      if (r.status === 410) { show('gone'); return; }
      if (tries < 30) setTimeout(ask, 2000); else show('slow');   // the payment's message from Polar is on its way
    }).catch(function () { if (tries < 30) setTimeout(ask, 3000); else show('slow'); });
  }
  ask();
})();
