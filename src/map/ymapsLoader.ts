import { getApiKey } from '../utils/apiKey';

const API_URL = 'https://api-maps.yandex.ru/2.1/';

let loadingPromise: Promise<typeof ymaps> | null = null;

/** Загружает Yandex Maps JS API 2.1 один раз за сессию. */
export function loadYmaps(): Promise<typeof ymaps> {
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<typeof ymaps>((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready().then(() => resolve(window.ymaps as typeof ymaps), reject);
      return;
    }

    const apiKey = getApiKey();
    const script = document.createElement('script');
    script.src = `${API_URL}?lang=ru_RU&apikey=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps API не инициализировался'));
        return;
      }
      window.ymaps.ready().then(() => resolve(window.ymaps as typeof ymaps), reject);
    };
    script.onerror = () => reject(new Error('Не удалось загрузить Yandex Maps API'));
    document.head.append(script);
  }).catch((error: unknown) => {
    loadingPromise = null;
    throw error;
  });

  return loadingPromise;
}
