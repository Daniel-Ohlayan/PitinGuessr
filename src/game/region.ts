import { CITY_LIST, type City, type CityListItem } from '../data/cities';
import {
  findRandomPanorama,
  getRandomPanoramaInCity,
  type FoundPanorama,
  type RandomPanoramaOptions,
} from '../panorama/randomPanorama';
import {
  bboxDiagonalMeters,
  boundsDiagonalMeters,
  destination,
  randomPointInBBox,
  toYmapsBounds,
  type CityGeometry,
} from '../utils/geo';

export type RegionSelection = { kind: 'city'; cityId: string } | { kind: 'russia' };

/** Игровая область: город или вся Россия. */
export interface GameRegion {
  selection: RegionSelection;
  title: string;
  /** Граница, которую рисуем на карте (для России не рисуем). */
  outline: CityGeometry | null;
  /** Стартовые границы карты для угадывания. */
  mapBounds: number[][];
  minZoom: number;
  /** «Размер карты» в метрах для формулы очков. */
  mapSize: number;
  /** Минимальное расстояние между панорамами разных раундов, м. */
  minSeparation: number;
  findPanorama(options: RandomPanoramaOptions): Promise<FoundPanorama>;
}

export function createCityRegion(city: City): GameRegion {
  return {
    selection: { kind: 'city', cityId: city.id },
    title: city.name,
    outline: city.geometry,
    mapBounds: toYmapsBounds(city.geometry),
    minZoom: 8,
    mapSize: bboxDiagonalMeters(city.geometry),
    minSeparation: 700,
    findPanorama: (options) => getRandomPanoramaInCity(city.geometry, options),
  };
}

/** Видимая часть России на карте: от Калининграда до Чукотки. */
const RUSSIA_BOUNDS: number[][] = [
  [41.0, 19.5],
  [77.0, 179.5],
];
/** Для очков: около 7000 км — масштаб в духе GeoGuessr для карты страны. */
const RUSSIA_MAP_SIZE = boundsDiagonalMeters(RUSSIA_BOUNDS);
const RUSSIA_SEARCH_RADIUS = 1000;
const RUSSIA_ATTEMPTS = 30;

/**
 * Панорамы Яндекса есть в основном в населённых пунктах и вдоль дорог, поэтому
 * случайная точка по всей территории почти никогда не попадёт в покрытие.
 * Как в GeoGuessr, выбираем место «там, где есть съёмка»: город со взвешиванием
 * по населению (крупные чаще, но малые тоже встречаются), затем точка в городе
 * или на расстоянии 3–30 км от него — пригороды, сёла, трассы.
 */
function createRussiaSampler(cities: CityListItem[]) {
  const weights = cities.map((c) => Math.pow(Math.max(c.population, 5000), 0.45));
  const total = weights.reduce((a, b) => a + b, 0);
  const pickCity = (): CityListItem => {
    let r = Math.random() * total;
    for (let i = 0; i < cities.length; i++) {
      r -= weights[i];
      if (r <= 0) return cities[i];
    }
    return cities[cities.length - 1];
  };
  return () => {
    const city = pickCity();
    if (Math.random() < 0.7) return randomPointInBBox(city.bbox);
    const distance = 3000 + Math.random() * 27000;
    return destination(city.center, distance, Math.random() * 360);
  };
}

export function createRussiaRegion(russia: CityGeometry): GameRegion {
  const sample = createRussiaSampler(CITY_LIST);
  return {
    selection: { kind: 'russia' },
    title: 'Вся Россия',
    outline: null,
    mapBounds: RUSSIA_BOUNDS,
    minZoom: 2,
    mapSize: RUSSIA_MAP_SIZE,
    minSeparation: 50000,
    findPanorama: (options) =>
      findRandomPanorama({
        ...options,
        boundary: russia,
        samplePoint: sample,
        radius: RUSSIA_SEARCH_RADIUS,
        maxAttempts: RUSSIA_ATTEMPTS,
      }),
  };
}
