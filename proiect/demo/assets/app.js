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

// ---------- demo booking form: validates, sends nothing ----------
(function booking() {
  const form = document.querySelector('[data-booking]');
  if (!form) return;
  const done = form.querySelector('[data-done]');
  const submit = form.querySelector('.booking__submit');
  const dateInput = form.querySelector('#f-zi');

  // today in Bucharest as the earliest date
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
  dateInput.min = today;

  const rules = {
    nume: (v) => (v.trim().length >= 2 ? '' : 'Scrie-ne numele tău, ca să știm pe cine căutăm.'),
    telefon: (v) => {
      const digits = v.replace(/\D/g, '');
      if (!digits) return 'Avem nevoie de un număr de telefon ca să te sunăm.';
      return digits.length >= 10 ? '' : 'Numărul pare incomplet. Verifică-l: ex. 0700 000 701.';
    },
    motiv: (v) => (v ? '' : 'Alege de ce ai nevoie, ca să pregătim evaluarea.'),
    zi: (v) => {
      if (!v) return '';
      if (v < today) return 'Alege o zi de azi încolo.';
      const d = new Date(v + 'T12:00:00').getDay();
      return d === 0 || d === 6 ? 'Sâmbăta și duminica suntem închiși. Alege o zi între luni și vineri.' : '';
    },
    acord: (_, el) => (el.checked ? '' : 'Bifează acordul ca să te putem suna.')
  };

  const check = (el) => {
    const rule = rules[el.name];
    if (!rule) return true;
    const msg = rule(el.value, el);
    const err = document.getElementById('e-' + el.id.replace('f-', ''));
    el.setAttribute('aria-invalid', String(Boolean(msg)));
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  };

  form.addEventListener('focusout', (e) => {
    const el = e.target;
    if (el.name in rules && (el.value || el.getAttribute('aria-invalid') === 'true')) check(el);
  });
  form.addEventListener('change', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' || e.target.type === 'checkbox') check(e.target);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...form.elements].filter((el) => el.name in rules);
    const results = fields.map(check);
    const firstBad = fields[results.indexOf(false)];
    if (firstBad) { firstBad.focus(); done.hidden = true; return; }

    submit.setAttribute('aria-busy', 'true');
    submit.querySelector('span').textContent = 'Se verifică…';
    setTimeout(() => {
      submit.removeAttribute('aria-busy');
      submit.querySelector('span').textContent = 'Trimite cererea';
      done.hidden = false;
      done.focus();
    }, 500);
  });
})();
