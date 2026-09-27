import { YANDEX_MAPS_API_KEY } from '../config';

/**
 * Ключ берётся из src/config.ts. Если там пусто — из переменной окружения
 * VITE_YANDEX_MAPS_API_KEY (файл .env.local), это удобно для CI/хостинга.
 */
export function getApiKey(): string {
  return YANDEX_MAPS_API_KEY.trim() || (import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '').trim();
}
