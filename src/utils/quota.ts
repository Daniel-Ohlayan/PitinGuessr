/**
 * Локальный счётчик обращений к Яндекс.Панорамам за сегодня.
 * На бесплатном ключе JS API лимит — 100 вызовов панорам в сутки.
 * Счётчик приблизительный: он видит только вызовы из этого браузера.
 */
export const FREE_PANORAMA_LIMIT = 100;
const STORAGE_KEY = 'pitinguessr.panoramaCalls';

interface Stored {
  date: string;
  count: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function read(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed.date === today()) return parsed;
    }
  } catch {
    /* localStorage недоступен */
  }
  return { date: today(), count: 0 };
}

export function getPanoramaCallsToday(): number {
  return read().count;
}

export function countPanoramaCall(): number {
  const data = read();
  data.count += 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* игнорируем */
  }
  return data.count;
}
