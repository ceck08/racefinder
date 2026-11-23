const select = (id) => document.getElementById(id);
const query = select('query');
const country = select('country');
const distance = select('distance');
const month = select('month');
const saved = select('saved');
const savedCount = select('saved-count');
const news = select('news');
const newsCount = select('news-count');
const reset = select('reset');
const count = select('count');
const grid = select('races');
const more = select('more');
const viewList = select('view-list');
const viewCal = select('view-cal');
const calView = select('calendar-view');
const calTitle = select('cal-title');
const calGrid = select('cal-grid');
const calPrev = select('cal-prev');
const calNext = select('cal-next');
const dayChip = select('day-chip');
const batchSize = 24;
const template = select('race-template');
const filters = [query, country, distance, month];
const storageKey = 'racefinder-favorites';
const dateOptions = { timeZone: 'UTC' };
const dayMonth = new Intl.DateTimeFormat('it-IT', { ...dateOptions, day: 'numeric', month: 'long', year: 'numeric' });
const shortMonth = new Intl.DateTimeFormat('it-IT', { ...dateOptions, month: 'short' });
const longMonth = new Intl.DateTimeFormat('it-IT', { ...dateOptions, month: 'long', year: 'numeric' });
const weekdayShort = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const kmFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const normalize = (value) => value.toLocaleLowerCase('it').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
const todayKey = new Date().toISOString().slice(0, 10);
const newsSince = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

let races = [];
let results = [];
let visible = 0;
const favorites = loadFavorites();
let favoritesOnly = false;
let newsOnly = false;
let dayFilter = '';
let view = 'list';
let calCursor = null;

function updateFavorite(button, race) {
  const active = favorites.has(race.id);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', `${active ? 'Rimuovi dai' : 'Aggiungi ai'} preferiti · ${race.title}`);
  button.firstElementChild.textContent = active ? '♥' : '♡';
}

function downloadIcs(race) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const day = race.date.replace(/-/g, '');
  const location = [race.city, race.country].filter(Boolean).join(', ');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RaceFinder//Calendario gare//IT',
    'BEGIN:VEVENT',
    `UID:${race.id}@racefinder`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${race.title.replace(/[,;\\]/g, ' ')}`,
    location ? `LOCATION:${location.replace(/[,;\\]/g, ' ')}` : '',
    `URL:${race.source}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  const blob = new Blob([lines], { type: 'text/calendar' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${race.id}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
}

function renderRace(race) {
  const card = template.content.firstElementChild.cloneNode(true);
  const date = new Date(race.date);
  card.classList.toggle('half', race.distance === 'half');
  const time = card.querySelector('time');
  time.dateTime = race.date;
  time.setAttribute('aria-label', dayMonth.format(date));
  time.firstElementChild.textContent = date.getUTCDate();
  time.lastElementChild.textContent = shortMonth.format(date);
  card.querySelector('.distance').textContent = `${kmFormat.format(race.distanceKm ?? (race.distance === '10' ? 10 : 21.1))} km`;
  card.querySelector('.location').textContent = [race.city, race.country].filter(Boolean).join(' · ');
  card.querySelector('h3').textContent = race.title;
  card.querySelector('a').href = race.source;
  if (race.addedAt && race.addedAt >= newsSince) {
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = 'Novità';
    card.querySelector('.race-top').append(badge);
  }
  const ics = card.querySelector('.ics');
  ics.setAttribute('aria-label', `Aggiungi al calendario · ${race.title}`);
  ics.addEventListener('click', () => downloadIcs(race));
  const button = card.querySelector('.favorite');
  updateFavorite(button, race);
  button.addEventListener('click', () => {
    if (favorites.has(race.id)) favorites.delete(race.id);
    else favorites.add(race.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...favorites]));
    } catch {
      // The current page can retain favorites when browser storage is unavailable.
    }
    if (favoritesOnly) {
      render();
      saved.focus();
    } else {
      updateFavorite(button, race);
      updateSavedCount();
    }
  });
  return card;
}

function updateSavedCount() {
  savedCount.textContent = races.filter((race) => favorites.has(race.id)).length;
}

function updateNewsCount() {
  newsCount.textContent = races.filter((race) => race.addedAt && race.addedAt >= newsSince).length;
}

function applyFilters() {
  const words = normalize(query.value).split(/\s+/).filter(Boolean);
  results = races.filter((race) => {
    const text = normalize(`${race.title} ${race.city ?? ''} ${race.country}`);
    return words.every((word) => text.includes(word)) &&
      (!country.value || race.country === country.value) &&
      (!distance.value || race.distance === distance.value) &&
      (!month.value || race.date.startsWith(month.value)) &&
      (!dayFilter || race.date === dayFilter) &&
      (!favoritesOnly || favorites.has(race.id)) &&
      (!newsOnly || (race.addedAt && race.addedAt >= newsSince));
  });
}

function render() {
  applyFilters();
  updateSavedCount();
  updateNewsCount();
  saved.setAttribute('aria-pressed', String(favoritesOnly));
  news.setAttribute('aria-pressed', String(newsOnly));
  viewList.setAttribute('aria-pressed', String(view === 'list'));
  viewCal.setAttribute('aria-pressed', String(view === 'cal'));
  reset.hidden = !(favoritesOnly || newsOnly || dayFilter || filters.some((field) => field.value));
  if (dayFilter) {
    dayChip.hidden = false;
    dayChip.firstChild.textContent = `Gare del ${dayMonth.format(new Date(dayFilter))} `;
  } else {
    dayChip.hidden = true;
  }
  calView.hidden = view !== 'cal';
  grid.hidden = view !== 'list';
  more.hidden = true;
  if (view === 'cal') {
    count.textContent = `${results.length} ${results.length === 1 ? 'gara' : 'gare'} nel calendario`;
    renderCalendar();
    return;
  }
  grid.replaceChildren();
  visible = 0;
  showMore();
  if (!results.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = favoritesOnly
      ? 'Nessuna gara preferita corrisponde alla selezione.'
      : 'Nessuna gara corrisponde alla ricerca. Prova a cambiare i filtri.';
    grid.append(empty);
  }
}

function showMore() {
  const batch = results.slice(visible, visible + batchSize).map(renderRace);
  grid.append(...batch);
  visible += batch.length;
  const remaining = results.length - visible;
  count.textContent = remaining > 0
    ? `${visible} di ${results.length} gare`
    : `${results.length} ${results.length === 1 ? 'gara' : 'gare'}`;
  more.hidden = remaining === 0;
  if (batch.length && more.hidden && document.activeElement === more) {
    batch[0].querySelector('.favorite').focus();
  }
}

function renderCalendar() {
  const months = [...new Set(results.map((race) => race.date.slice(0, 7)))].sort();
  if (!months.length) {
    calTitle.textContent = 'Nessuna gara';
    calGrid.replaceChildren();
    calPrev.disabled = calNext.disabled = true;
    return;
  }
  if (!calCursor || !months.includes(calCursor)) {
    calCursor = months.find((key) => key >= todayKey.slice(0, 7)) ?? months[0];
  }
  const [year, mon] = calCursor.split('-').map(Number);
  calTitle.textContent = longMonth.format(new Date(`${calCursor}-01`));
  const idx = months.indexOf(calCursor);
  calPrev.disabled = idx === 0;
  calNext.disabled = idx === months.length - 1;

  const byDay = new Map();
  for (const race of results) {
    if (!race.date.startsWith(calCursor)) continue;
    const day = Number(race.date.slice(8, 10));
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(race);
  }

  const cells = [];
  for (const name of weekdayShort) {
    const head = document.createElement('span');
    head.className = 'cal-weekday';
    head.textContent = name;
    cells.push(head);
  }
  const firstWeekday = (new Date(Date.UTC(year, mon - 1, 1)).getUTCDay() + 6) % 7;
  for (let i = 0; i < firstWeekday; i++) {
    const gap = document.createElement('span');
    gap.className = 'cal-day cal-gap';
    gap.setAttribute('aria-hidden', 'true');
    cells.push(gap);
  }
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement(byDay.has(day) ? 'button' : 'span');
    cell.className = 'cal-day';
    const racesOfDay = byDay.get(day) ?? [];
    if (racesOfDay.length) {
      cell.type = 'button';
      const key = `${calCursor}-${String(day).padStart(2, '0')}`;
      cell.setAttribute('aria-label', `${dayMonth.format(new Date(key))}: ${racesOfDay.length} ${racesOfDay.length === 1 ? 'gara' : 'gare'}`);
      cell.setAttribute('aria-pressed', String(dayFilter === key));
      cell.addEventListener('click', () => {
        dayFilter = dayFilter === key ? '' : key;
        view = 'list';
        render();
        if (dayFilter) select('gare').scrollIntoView();
      });
    }
    const num = document.createElement('span');
    num.className = 'cal-num';
    num.textContent = day;
    cell.append(num);
    for (const race of racesOfDay.slice(0, 3)) {
      const chip = document.createElement('span');
      chip.className = `cal-chip${race.distance === 'half' ? ' half' : ''}`;
      chip.textContent = race.city ?? race.title;
      cell.append(chip);
    }
    if (racesOfDay.length > 3) {
      const extra = document.createElement('span');
      extra.className = 'cal-more';
      extra.textContent = `+${racesOfDay.length - 3}`;
      cell.append(extra);
    }
    cells.push(cell);
  }
  calGrid.replaceChildren(...cells);
}

try {
  const response = await fetch('races.json');
  if (!response.ok) throw new Error('Catalogo non disponibile');
  races = (await response.json()).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'it'));
  const countries = [...new Set(races.map((race) => race.country))].sort((a, b) => a.localeCompare(b, 'it'));
  const months = new Set(races.map((race) => race.date.slice(0, 7)));
  for (const name of countries) country.add(new Option(name, name));
  for (const key of months) month.add(new Option(longMonth.format(new Date(`${key}-01`)), key));

  more.addEventListener('click', showMore);
  query.addEventListener('input', render);
  for (const field of [country, distance, month]) field.addEventListener('change', render);
  document.querySelector('.filters').addEventListener('submit', (event) => event.preventDefault());
  reset.addEventListener('click', () => {
    for (const field of filters) field.value = '';
    favoritesOnly = false;
    newsOnly = false;
    dayFilter = '';
    render();
    query.focus();
  });
  saved.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    if (favoritesOnly) newsOnly = false;
    render();
    select('gare').scrollIntoView();
  });
  news.addEventListener('click', () => {
    newsOnly = !newsOnly;
    if (newsOnly) favoritesOnly = false;
    render();
    select('gare').scrollIntoView();
  });
  viewList.addEventListener('click', () => { view = 'list'; render(); });
  viewCal.addEventListener('click', () => { view = 'cal'; render(); });
  calPrev.addEventListener('click', () => {
    const months = [...new Set(results.map((race) => race.date.slice(0, 7)))].sort();
    const idx = months.indexOf(calCursor);
    if (idx > 0) calCursor = months[idx - 1];
    renderCalendar();
  });
  calNext.addEventListener('click', () => {
    const months = [...new Set(results.map((race) => race.date.slice(0, 7)))].sort();
    const idx = months.indexOf(calCursor);
    if (idx >= 0 && idx < months.length - 1) calCursor = months[idx + 1];
    renderCalendar();
  });
  dayChip.addEventListener('click', () => { dayFilter = ''; render(); });
  render();
} catch {
  count.textContent = 'Il catalogo non è disponibile. Ricarica la pagina per riprovare.';
}
