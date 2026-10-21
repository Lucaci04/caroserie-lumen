// Caroserie Lumen — demo interactions: open/closed status, mobile menu, before/after reveal, demo booking form.
document.documentElement.classList.add('js');

// ---------- open / closed, from the posted hours (Mon–Fri 09:00–18:00, Europe/Bucharest) ----------
(function status() {
  const el = document.querySelector('[data-status]');
  const text = document.querySelector('[data-status-text]');
  if (!el || !text) return;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const weekday = day >= 1 && day <= 5;
  const open = weekday && minutes >= 9 * 60 && minutes < 18 * 60;

  let msg;
  if (open) msg = 'Deschis acum · până la 18:00';
  else if (weekday && minutes < 9 * 60) msg = 'Închis · deschidem azi la 09:00';
  else if (day >= 1 && day <= 4) msg = 'Închis · deschidem mâine la 09:00';
  else msg = 'Închis · deschidem luni la 09:00';

  el.dataset.open = String(open);
  text.textContent = msg;

  document.querySelectorAll('.hours tr[data-days]').forEach((row) => {
    const today = row.dataset.days === '1-5' ? weekday : !weekday;
    row.classList.toggle('is-today', today);
    if (today) row.setAttribute('aria-current', 'date');
  });
})();

// ---------- mobile menu ----------
(function menu() {
  const toggle = document.querySelector('.top__toggle');
  const nav = document.getElementById('meniu');
  if (!toggle || !nav) return;
  const use = toggle.querySelector('use');
  const label = toggle.querySelector('.visually-hidden');

  const set = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    use.setAttribute('href', open ? '#i-close' : '#i-menu');
    label.textContent = open ? 'Închide meniul' : 'Meniu';
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
  });
})();

// ---------- before / after: peel the tape ----------
document.querySelectorAll('[data-reveal]').forEach((fig) => {
  const stage = fig.querySelector('.reveal__stage');
  const range = fig.querySelector('.reveal__range');
  if (!stage || !range) return;
  const update = () => stage.style.setProperty('--pos', range.value + '%');
  range.addEventListener('input', update);
  update();
});

// ---------- services: collapsed on phones, open on desktop ----------
(function jobs() {
  const mq = window.matchMedia('(min-width: 860px)');
  const items = [...document.querySelectorAll('details.job')];
  const sync = () => items.forEach((d, i) => { d.open = mq.matches || i === 0; });
  sync();
  mq.addEventListener('change', sync);
})();

// ---------- booking: details sent through WhatsApp or e-mail ----------
(function booking() {
  const form = document.querySelector('[data-booking]');
  if (!form) return;

  // Contact channels. WhatsApp uses the shop phone; confirm it is a WhatsApp number before publishing.
  const WHATSAPP = '40700000701';
  const EMAIL = 'contact@caroserie-lumen.example';
  const DRAFT_KEY = 'mati-programare-draft';

  const done = form.querySelector('[data-done]');
  const claim = form.querySelector('[data-claim]');
  const rcaChip = form.querySelector('input[name="servicii"][value^="Reparație după accident"]');
  const dateInput = form.querySelector('#f-zi');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
  dateInput.min = today;

  const val = (name) => (form.elements[name]?.value || '').trim();
  const services = () => [...form.querySelectorAll('input[name="servicii"]:checked')].map((c) => c.value);

  const rules = {
    nume: (v) => (v.trim().length >= 2 ? '' : 'Scrie-ne numele tău, ca să știm pe cine căutăm.'),
    telefon: (v) => {
      const digits = v.replace(/\D/g, '');
      if (!digits) return 'Avem nevoie de un număr de telefon ca să te sunăm.';
      return digits.length >= 10 ? '' : 'Numărul pare incomplet. Verifică-l: ex. 0700 000 701.';
    },
    an: (v) => {
      if (!v) return '';
      const y = Number(v), max = new Date().getFullYear() + 1;
      return /^\d{4}$/.test(v) && y >= 1950 && y <= max ? '' : `Scrie anul cu 4 cifre, între 1950 și ${max}.`;
    },
    vin: (v) => {
      if (!v) return '';
      if (v.length !== 17) return `Seria de șasiu are 17 caractere. Acum are ${v.length}.`;
      return /^[A-HJ-NPR-Z0-9]{17}$/.test(v) ? '' : 'Seria de șasiu nu conține literele I, O sau Q. Verifică-le: pot fi cifrele 1 și 0.';
    },
    zi: (v) => {
      if (!v) return '';
      if (v < today) return 'Alege o zi de azi încolo.';
      const d = new Date(v + 'T12:00:00').getDay();
      return d === 0 || d === 6 ? 'Sâmbăta și duminica suntem închiși. Alege o zi între luni și vineri.' : '';
    },
    acord: (_, el) => (el.checked ? '' : 'Bifează acordul ca să te putem contacta.')
  };

  const showError = (id, msg, el) => {
    const err = document.getElementById('e-' + id);
    if (el) el.setAttribute('aria-invalid', String(Boolean(msg)));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };
  const check = (el) => {
    const rule = rules[el.name];
    return rule ? showError(el.id.replace('f-', ''), rule(el.value, el), el) : true;
  };
  const checkServices = () => showError('servicii', services().length ? '' : 'Alege cel puțin un serviciu.');

  // uppercase plate and VIN as they are typed
  ['nr', 'vin'].forEach((n) => form.elements[n].addEventListener('input', (e) => {
    const el = e.target, pos = el.selectionStart;
    el.value = el.value.toUpperCase().replace(n === 'vin' ? /[^A-Z0-9]/g : /[^A-Z0-9 -]/g, '');
    el.setSelectionRange(pos, pos);
  }));

  const toggleClaim = () => { claim.hidden = !rcaChip.checked; };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'servicii') { toggleClaim(); if (!document.getElementById('e-servicii').hidden) checkServices(); }
    else if (e.target.getAttribute('aria-invalid') === 'true' || e.target.type === 'checkbox') check(e.target);
    saveDraft();
  });
  form.addEventListener('focusout', (e) => {
    const el = e.target;
    if (el.name in rules && (el.value || el.getAttribute('aria-invalid') === 'true')) check(el);
  });
  // clear an error while typing, so the layout never shifts under a tap on blur
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true') check(e.target);
    saveDraft();
  });

  // draft: a convenience only, kept on this device until sent
  function saveDraft() {
    const data = {};
    [...form.elements].forEach((el) => {
      if (!el.name || el.name === 'acord') return;
      if (el.type === 'checkbox') { if (el.checked) (data[el.name] ||= []).push(el.value); }
      else data[el.name] = el.value;
    });
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (_) { /* storage unavailable */ }
  }
  (function restore() {
    let data;
    try { data = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (_) { return; }
    if (!data) return;
    [...form.elements].forEach((el) => {
      if (!el.name || !(el.name in data)) return;
      if (el.type === 'checkbox') el.checked = data[el.name].includes(el.value);
      else el.value = data[el.name];
    });
    toggleClaim();
  })();

  const message = () => {
    const car = [val('marca'), val('an')].filter(Boolean).join(', ');
    const zi = val('zi') ? new Date(val('zi') + 'T12:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    const details = [
      `Nume: ${val('nume')}`,
      `Telefon: ${val('telefon')}`,
      `Servicii: ${services().join(', ')}`,
      !claim.hidden && val('asigurator') && `Asigurător: ${val('asigurator')}`,
      !claim.hidden && val('dosar') && `Nr. dosar daună: ${val('dosar')}`,
      car && `Mașina: ${car}`,
      val('nr') && `Nr. înmatriculare: ${val('nr')}`,
      val('vin') && `Serie șasiu (VIN): ${val('vin')}`,
      zi && `Ziua preferată: ${zi}`,
      val('mesaj') && `Detalii: ${val('mesaj')}`
    ].filter(Boolean);
    return ['Bună ziua! Aș dori o programare / ofertă.', '', ...details].join('\n');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...form.elements].filter((el) => el.name in rules);
    const okFields = fields.map(check);
    const okServices = checkServices();
    const firstBad = !okServices ? form.querySelector('input[name="servicii"]') : fields[okFields.indexOf(false)];
    if (firstBad) { firstBad.focus(); done.hidden = true; return; }

    const text = message();
    if (e.submitter?.value === 'email') {
      const subject = `Programare: ${services()[0] || 'service'} – ${val('nume')}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* storage unavailable */ }
    done.hidden = false;
    done.focus();
  });
})();
