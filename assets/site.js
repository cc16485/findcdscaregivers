/* Caring Companions CDS — shared behaviour.
   Every page loads this. Each piece checks whether its element exists first, so
   one file can serve pages that have a form and pages that do not. */

/* ---------- the 27 counties we serve, common picks first ---------- */
var CDS_COUNTIES = ['Greene','Christian','Jasper','Taney','Polk','Webster','Lawrence','Newton',
  'Barry','Stone','Dade','Douglas','Dallas','Cedar','Hickory','Laclede','McDonald','Ozark',
  'Wright','Texas','Phelps','Pulaski','Camden','Benton','St. Clair','Vernon','Barton'];

/* ---------- mobile menu ---------- */
(function () {
  var btn = document.getElementById('menuBtn'), drawer = document.getElementById('drawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', function () {
    var open = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

/* ---------- county dropdowns ---------- */
(function () {
  var sels = document.querySelectorAll('select[data-counties]');
  if (!sels.length) return;
  var alpha = CDS_COUNTIES.slice().sort(function (a, b) { return a.localeCompare(b); });
  var html = alpha.map(function (c) { return '<option>' + c + '</option>'; }).join('')
           + '<option value="Outside these counties">Somewhere else in Missouri</option>';
  Array.prototype.forEach.call(sels, function (s) { s.insertAdjacentHTML('beforeend', html); });
})();

/* ---------- phone formatting ---------- */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('input[type="tel"]'), function (el) {
    el.addEventListener('input', function () {
      var d = el.value.replace(/\D/g, '').slice(0, 10);
      el.value = d.length > 6 ? '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6)
               : d.length > 3 ? '(' + d.slice(0,3) + ') ' + d.slice(3)
               : d.length > 0 ? '(' + d : '';
    });
  });
})();

/* ---------- lead forms ----------
   Any <form data-lead-form="<source>"> is wired up automatically. Fields are read
   by their name attribute, and anything marked required is validated first.

   Submissions go to Supabase, which is the system of record so an enquiry is never
   lost. Before go-live this also needs to POST to Samantha's GoHighLevel inbound
   webhook so her existing follow-up automations still fire — see GHL_WEBHOOK below.
*/
var SUPABASE_URL  = 'https://siivpekcaryeyttszwav.supabase.co';
var SUPABASE_ANON = 'sb_publishable_iDJ00Ve4hw5iw2YtVmiulg__FmjShmO';
var AGENCY_ID     = 'caring-companions-cds';
var GHL_WEBHOOK   = null;   // set this to the GHL inbound webhook URL to enable automations

(function () {
  var forms = document.querySelectorAll('form[data-lead-form]');
  if (!forms.length) return;

  Array.prototype.forEach.call(forms, function (form) {
    var errBox = form.querySelector('.alert.err');
    var okBox  = form.querySelector('.alert.ok');
    var btn    = form.querySelector('button[type="submit"]');
    var btnLabel = btn ? btn.textContent : 'Send';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      /* validate */
      var problems = [];
      Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) { f.classList.remove('bad'); });

      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
        var field = el.closest('.field');
        var label = (field && field.querySelector('label')) ? field.querySelector('label').textContent : 'a field';
        label = label.replace('*','').trim().toLowerCase();
        var bad = !el.value.trim();
        if (!bad && el.type === 'tel') bad = el.value.replace(/\D/g,'').length !== 10;
        if (bad) {
          problems.push(el.type === 'tel' ? 'a 10-digit phone number' : label);
          if (field) field.classList.add('bad');
        }
      });

      if (problems.length) {
        if (errBox) {
          errBox.textContent = 'Please add ' + problems.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
          errBox.classList.add('show');
          errBox.scrollIntoView({ behavior:'smooth', block:'center' });
        }
        if (okBox) okBox.classList.remove('show');
        return;
      }
      if (errBox) errBox.classList.remove('show');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      /* collect every named field */
      var row = { agency_id: AGENCY_ID, source: form.getAttribute('data-lead-form') };
      Array.prototype.forEach.call(form.querySelectorAll('[name]'), function (el) {
        var v = (el.value || '').trim();
        row[el.name] = v || null;
      });
      var firstName = row.first_name || (row.full_name || '').split(' ')[0] || 'there';

      try {
        var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        var res = await db.from('site_leads').insert(row);
        if (res.error) throw res.error;

        /* Fire the GHL automation too, if configured. Deliberately after the
           database write and deliberately non-fatal: a webhook outage must never
           make a real enquiry look like it failed. */
        if (GHL_WEBHOOK) {
          try { await fetch(GHL_WEBHOOK, {
            method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(row)
          }); } catch (ignore) {}
        }

        Array.prototype.forEach.call(form.querySelectorAll('input,select,textarea,button'), function (el) { el.disabled = true; });
        if (okBox) {
          okBox.innerHTML = '<strong>Thank you, ' + firstName + '.</strong> We have your details and someone will call you'
            + (row.phone ? ' on ' + row.phone : '') + '. If you would rather not wait, call us on '
            + '<a href="tel:+14172182888">417-218-2888</a>.';
          okBox.classList.add('show');
          okBox.scrollIntoView({ behavior:'smooth', block:'center' });
        }
      } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        if (errBox) {
          errBox.innerHTML = 'Something went wrong sending that, so nothing was submitted. Please call us on '
            + '<a href="tel:+14172182888" style="color:#8b2e24;font-weight:700">417-218-2888</a>, or toll free 866-863-5151, and we will help straight away.'
            + '<br><span style="font-size:.85em;opacity:.75">' + (err.message || 'unknown error') + '</span>';
          errBox.classList.add('show');
        }
      }
    });
  });
})();
