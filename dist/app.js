const select = (id) => document.getElementById(id);
const query = select('query');
const country = select('country');
const distance = select('distance');
const month = select('month');
const saved = select('saved');
const savedCount = select('saved-count');
const reset = select('reset');
const count = select('count');
const grid = select('races');
const more = select('more');
const batchSize = 24;
const template = select('race-template');
const filters = [query, country, distance, month];
const storageKey = 'racefinder-favorites';
const dateOptions = { timeZone: 'UTC' };
const dayMonth = new Intl.DateTimeFormat('it-IT', { ...dateOptions, day: 'numeric', month: 'long', year: 'numeric' });
const shortMonth = new Intl.DateTimeFormat('it-IT', { ...dateOptions, month: 'short' });
const longMonth = new Intl.DateTimeFormat('it-IT', { ...dateOptions, month: 'long', year: 'numeric' });
const kmFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const normalize = (value) => value.toLocaleLowerCase('it').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

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

function updateFavorite(button, race) {
  const active = favorites.has(race.id);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', `${active ? 'Rimuovi dai' : 'Aggiungi ai'} preferiti · ${race.title}`);
  button.firstElementChild.textContent = active ? '♥' : '♡';
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

function render() {
  const words = normalize(query.value).split(/\s+/).filter(Boolean);
  results = races.filter((race) => {
    const text = normalize(`${race.title} ${race.city} ${race.country}`);
    return words.every((word) => text.includes(word)) &&
      (!country.value || race.country === country.value) &&
      (!distance.value || race.distance === distance.value) &&
      (!month.value || race.date.startsWith(month.value)) &&
      (!favoritesOnly || favorites.has(race.id));
  });
  updateSavedCount();
  saved.setAttribute('aria-pressed', String(favoritesOnly));
  reset.hidden = !(favoritesOnly || filters.some((field) => field.value));
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
    render();
    query.focus();
  });
  saved.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    render();
    select('gare').scrollIntoView();
  });
  render();
} catch {
  count.textContent = 'Il catalogo non è disponibile. Ricarica la pagina per riprovare.';
}
