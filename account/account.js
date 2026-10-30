// My purchase (haltmode.com/account/): kept in its own file so the page can allow only scripts from haltmode.com
(function () {
  var API = 'https://halt-license.haltmode.workers.dev';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var day = function (iso) { try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; } };
  var tok = (location.hash.match(/t=([A-Za-z0-9_.-]+)/) || [])[1] || '';
  if (tok) { try { sessionStorage.setItem('halt_acct', tok); } catch (e) {} history.replaceState(null, '', location.pathname); }   // keep the link out of the address bar
  else { try { tok = sessionStorage.getItem('halt_acct') || ''; } catch (e) {} }

  // ---- ask for a sign-in link ----
  var af = $('askform');
  af.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (af.email.value || '').trim(), b = af.querySelector('button');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('asknote').textContent = 'Please enter a valid email address.'; return; }
    b.disabled = true; b.textContent = 'Sending…';
    fetch(API + '/v1/account/link', { method: 'POST', body: new URLSearchParams({ email: email, hp_check: af.hp_check.value }) })
      .then(function (r) { $('asknote').textContent = r.ok ? 'If that email bought Halt Pro, a sign-in link is on its way. It works for an hour. Check your spam folder too.' : (r.status === 400 ? 'Please enter a valid email address.' : 'That didn’t go through. Try again in a minute.'); })
      .catch(function () { $('asknote').textContent = 'That didn’t go through. Try again in a minute.'; })
      .then(function () { b.disabled = false; b.textContent = 'Email me a link'; });
  });

  // ---- the purchase ----
  function call(body) {
    body.t = tok;
    return fetch(API + '/v1/account', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }, function () { return { _status: r.status }; }); });
  }
  function signedOut(why) { try { sessionStorage.removeItem('halt_acct'); } catch (e) {} tok = ''; $('view').hidden = true; $('ask').hidden = false; $('asknote').textContent = why || ''; }
  function render(j) {
    if (j._status === 401) { signedOut('That link has expired. Enter your email for a new one.'); return; }
    if (j._status !== 200) { $('msg').className = 'note bad'; $('msg').textContent = j.error || 'Something went wrong. Try again in a minute.'; return; }
    $('ask').hidden = true; $('view').hidden = false;
    $('who').textContent = 'Signed in as ' + j.email + '.';
    var out = '';
    (j.licenses || []).forEach(function (l) {
      var active = l.status === 'active';
      out += '<div class="card lic"><h3>Halt Pro</h3><p class="meta">Bought ' + esc(day(l.bought)) + ' · ' + (active ? 'Active' : 'Refunded or cancelled') + ' · license ' + esc(l.lid) + '</p>';
      if (active) {
        out += '<p class="note">Used on ' + l.pcs.length + (l.pcs.length === 1 ? ' PC' : ' PCs') + '. To add a PC, open Halt there and press <b>I already bought it</b>.</p>';
        l.pcs.forEach(function (p) { out += '<div class="pc"><div>' + esc(p.name) + '<small>Last seen ' + esc(day(p.lastSeen)) + '</small></div><button class="btn sm" data-a="release" data-l="' + esc(l.lid) + '" data-p="' + p.id + '">Remove</button></div>'; });
        out += '<div class="acts">';
        if (l.refund.ok) out += '<button class="btn sm" data-a="refund" data-l="' + esc(l.lid) + '">Refund</button>';
        out += '</div>';
        out += '<p class="note" style="margin-top:12px">' + (l.refund.ok ? 'You can get a full refund until ' + esc(day(l.refund.until)) + '. It goes back to the card you paid with, and Halt Pro stops on all your PCs.' : esc(l.refund.why)) + '</p>';
      }
      out += '</div>';
    });
    $('lics').innerHTML = out || '<p class="note">No purchases found for this email.</p>';
  }
  $('lics').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'refund' && !confirm('Refund Halt Pro in full? Halt goes back to Halt Basic on all your PCs. This can\'t be undone.')) return;
    if (a === 'release' && !confirm('Sign this PC out of Halt Pro? Halt goes back to Halt Basic there until you unlock it again with your email.')) return;
    b.disabled = true; $('msg').className = 'note'; $('msg').textContent = 'Working…';
    call({ action: a, lid: b.getAttribute('data-l'), pc: b.getAttribute('data-p') }).then(function (j) {
      render(j);
      if (j._status === 200) { $('msg').className = 'note good'; $('msg').textContent = j.refunded ? 'Refunded. The money is on its way back to your card; banks usually take 5 to 10 days to show it.' : j.sent ? 'Your key is on its way to your inbox.' : j.released ? 'That PC was removed.' : ''; }
    }).catch(function () { b.disabled = false; $('msg').className = 'note bad'; $('msg').textContent = 'That didn’t go through. Try again in a minute.'; });
  });
  if (tok) call({ action: 'view' }).then(render).catch(function () { signedOut('That didn’t go through. Try again in a minute.'); });
})();
