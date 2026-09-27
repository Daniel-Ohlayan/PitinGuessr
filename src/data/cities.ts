import cityIndex from './cities.json';
import type { CityGeometry, LatLng } from '../utils/geo';

/** Запись индекса городов (без геометрии — она грузится по требованию). */
export interface CityListItem {
  id: string;
  name: string;
  slug: string;
  region: string;
  population: number;
  /** [широта, долгота] */
  center: LatLng;
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number];
  /** Номер файла public/data/cities/part-XX.json, где лежит полигон. */
  chunk: number;
}

export interface City extends CityListItem {
  geometry: CityGeometry;
}

export const CITY_LIST: CityListItem[] = (cityIndex as unknown as CityListItem[])
  .slice()
  .sort((a, b) => b.population - a.population || a.name.localeCompare(b.name, 'ru'));

const normalize = (s: string) => s.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();

/** Поиск по названию и региону. Сначала совпадения с начала названия, затем остальные. */
export function searchCities(query: string): CityListItem[] {
  const q = normalize(query);
  if (!q) return CITY_LIST;
  const starts: CityListItem[] = [];
  const contains: CityListItem[] = [];
  for (const city of CITY_LIST) {
    const name = normalize(city.name);
    if (name.startsWith(q)) starts.push(city);
    else if (name.includes(q) || normalize(city.region).includes(q)) contains.push(city);
  }
  return [...starts, ...contains];
}

export function getCityListItem(id: string): CityListItem | undefined {
  return CITY_LIST.find((c) => c.id === id);
}

/**
 * Полигоны разложены по 24 файлам (~200 КБ), чтобы проект было легко загрузить
 * на GitHub через браузер. Загружается только файл с выбранным городом.
 */
const chunkCache = new Map<number, Promise<Record<string, CityGeometry>>>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
  return (await response.json()) as T;
}

function loadChunk(chunk: number): Promise<Record<string, CityGeometry>> {
  let promise = chunkCache.get(chunk);
  if (!promise) {
    promise = fetchJson<Record<string, CityGeometry>>(
      `data/cities/part-${String(chunk).padStart(2, '0')}.json`,
    );
    chunkCache.set(chunk, promise);
    promise.catch(() => chunkCache.delete(chunk));
  }
  return promise;
}

/** Загружает GeoJSON-полигон только выбранного города. */
export async function loadCity(id: string): Promise<City> {
  const item = getCityListItem(id);
  if (!item) throw new Error(`Город с id=${id} не найден`);
  const geometry = (await loadChunk(item.chunk))[id];
  if (!geometry) throw new Error(`Нет границ для города ${item.name}`);
  return { ...item, geometry };
}

let russiaPromise: Promise<CityGeometry> | null = null;

/** Упрощённая граница России — для режима «Вся Россия». */
export function loadRussiaGeometry(): Promise<CityGeometry> {
  if (!russiaPromise) {
    russiaPromise = fetchJson<CityGeometry>('data/russia.json');
    russiaPromise.catch(() => {
      russiaPromise = null;
    });
  }
  return russiaPromise;
}
