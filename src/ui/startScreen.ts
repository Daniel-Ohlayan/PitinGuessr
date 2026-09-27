import { CITY_LIST, searchCities, type CityListItem } from '../data/cities';
import type { RegionSelection } from '../game/region';
import { GAME_SUBTITLE, GAME_TITLE } from '../config';
import { h } from '../utils/dom';

export interface StartScreenOptions {
  selectedId?: string | null;
  mode?: 'city' | 'russia';
  onPlay: (selection: RegionSelection) => void;
}

const LIST_LIMIT = 80;

function formatPopulation(n: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} млн`;
  if (n >= 1000) return `${Math.round(n / 1000)} тыс.`;
  return String(n);
}

export function renderStartScreen(root: HTMLElement, options: StartScreenOptions): () => void {
  let selectedId: string | null = options.selectedId ?? null;
  let mode: 'city' | 'russia' = options.mode ?? 'city';

  // ---------- Вкладки ----------
  const tabCity = h('button', { class: 'tab', type: 'button' }, 'Один город');
  const tabRussia = h('button', { class: 'tab', type: 'button' }, 'Вся Россия');

  // ---------- Город ----------
  const search = h('input', {
    class: 'search',
    type: 'search',
    placeholder: `Поиск среди ${CITY_LIST.length} городов`,
    autocomplete: 'off',
    'aria-label': 'Поиск города',
  });
  const list = h('ul', { class: 'city-list', role: 'listbox' });
  const listNote = h('p', { class: 'city-empty', hidden: true });
  const playBtn = h('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: true },
    'Играть только в этом городе');
  const cityPane = h('div', { class: 'pane' }, search, list, listNote, playBtn);

  // ---------- Россия ----------
  const russiaBtn = h('button', { class: 'btn btn-primary btn-lg', type: 'button' }, 'Играть по всей России');
  const russiaPane = h('div', { class: 'pane' },
    h('div', { class: 'russia-card' },
      h('div', { class: 'russia-emoji' }, '🇷🇺'),
      h('p', {}, 'Случайные панорамы по всей стране — от Калининграда до Владивостока: города, пригороды и трассы.'),
      h('p', { class: 'muted' }, 'Карта — вся Россия. Очки считаются по масштабу страны, как в GeoGuessr.'),
    ),
    russiaBtn,
  );

  // ---------- Логика ----------
  const renderList = (items: CityListItem[]) => {
    const shown = items.slice(0, LIST_LIMIT);
    list.replaceChildren(
      ...shown.map((city) =>
        h('li', {
          class: `city-item${city.id === selectedId ? ' is-selected' : ''}`,
          role: 'option',
          tabindex: 0,
          'aria-selected': city.id === selectedId ? 'true' : 'false',
          'data-id': city.id,
        },
          h('span', { class: 'city-name' }, city.name,
            h('span', { class: 'city-region' }, city.region)),
          h('span', { class: 'city-pop' }, formatPopulation(city.population)),
        ),
      ),
    );
    if (!items.length) {
      listNote.textContent = 'Город не найден';
      listNote.hidden = false;
    } else if (items.length > LIST_LIMIT) {
      listNote.textContent = `Показаны ${LIST_LIMIT} из ${items.length} — уточните поиск`;
      listNote.hidden = false;
    } else {
      listNote.hidden = true;
    }
  };

  const select = (id: string) => {
    selectedId = id;
    playBtn.disabled = false;
    list.querySelectorAll<HTMLLIElement>('.city-item').forEach((el) => {
      const isSel = el.dataset.id === id;
      el.classList.toggle('is-selected', isSel);
      el.setAttribute('aria-selected', String(isSel));
    });
  };

  const playCity = (id: string) => options.onPlay({ kind: 'city', cityId: id });

  const setMode = (next: 'city' | 'russia') => {
    mode = next;
    tabCity.classList.toggle('is-active', mode === 'city');
    tabRussia.classList.toggle('is-active', mode === 'russia');
    cityPane.hidden = mode !== 'city';
    russiaPane.hidden = mode !== 'russia';
    if (mode === 'city') search.focus();
    else russiaBtn.focus();
  };

  tabCity.addEventListener('click', () => setMode('city'));
  tabRussia.addEventListener('click', () => setMode('russia'));
  russiaBtn.addEventListener('click', () => options.onPlay({ kind: 'russia' }));

  search.addEventListener('input', () => {
    const items = searchCities(search.value);
    renderList(items);
    if (items.length === 1) select(items[0].id);
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = searchCities(search.value)[0];
      if (selectedId) playCity(selectedId);
      else if (first) select(first.id);
    }
  });
  list.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLLIElement>('.city-item');
    if (item?.dataset.id) select(item.dataset.id);
  });
  list.addEventListener('dblclick', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLLIElement>('.city-item');
    if (item?.dataset.id) playCity(item.dataset.id);
  });
  list.addEventListener('keydown', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLLIElement>('.city-item');
    if (!item?.dataset.id) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (selectedId === item.dataset.id && e.key === 'Enter') playCity(item.dataset.id);
      else select(item.dataset.id);
    }
  });
  playBtn.addEventListener('click', () => {
    if (selectedId) playCity(selectedId);
  });

  // Если город был выбран раньше — показываем его первым в списке.
  const initial = searchCities('');
  const prev = selectedId ? initial.find((c) => c.id === selectedId) : undefined;
  renderList(prev ? [prev, ...initial.filter((c) => c !== prev)] : initial);
  if (selectedId) select(selectedId);

  const screen = h('div', { class: 'screen start' },
    h('div', { class: 'start-card' },
      h('div', { class: 'logo' }, h('span', { class: 'logo-pin' }), GAME_TITLE),
      h('p', { class: 'subtitle' }, GAME_SUBTITLE),
      h('div', { class: 'tabs' }, tabCity, tabRussia),
      cityPane,
      russiaPane,
    ),
  );

  root.replaceChildren(screen);
  setMode(mode);
  return () => screen.remove();
}
