import { toYmapsPolygons, type CityGeometry, type LatLng } from '../utils/geo';

export interface GuessMapConfig {
  /** Стартовые границы карты: [[юг, запад], [север, восток]]. */
  bounds: number[][];
  /** Контур игровой области (город). null — не рисовать. */
  outline: CityGeometry | null;
  minZoom: number;
}

const GUESS_PRESET = 'islands#blueCircleDotIcon';
const REAL_PRESET = 'islands#redDotIcon';

/** Карта для угадывания: границы города, метка игрока, результат раунда. */
export class GuessMap {
  private readonly map: ymaps.Map;
  private readonly cityBounds: number[][];
  private guessMark: ymaps.Placemark | null = null;
  private resultObjects: ymaps.IGeoObject[] = [];
  private locked = false;
  private guess: LatLng | null = null;
  private readonly resizeObserver: ResizeObserver;
  /** Границы, которые нужно заново вписать при изменении размера карты (пока игрок сам не двигал карту). */
  private autoFit: { bounds: number[][]; margin: number } | null = null;
  private resizeTimer = 0;

  constructor(
    container: HTMLElement,
    config: GuessMapConfig,
    private readonly onGuessChange: (guess: LatLng | null) => void,
  ) {
    this.cityBounds = config.bounds;
    const [[s, w], [n, e]] = this.cityBounds;

    this.map = new ymaps.Map(
      container,
      { center: [(s + n) / 2, (w + e) / 2], zoom: 10, controls: ['zoomControl'] },
      {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true,
        minZoom: config.minZoom,
      },
    );

    for (const rings of config.outline ? toYmapsPolygons(config.outline) : []) {
      this.map.geoObjects.add(
        new ymaps.Polygon(rings, {}, {
          fillColor: '#ffcc00',
          fillOpacity: 0.06,
          strokeColor: '#ff8a00',
          strokeWidth: 2,
          strokeOpacity: 0.8,
          interactivityModel: 'default#transparent',
          cursor: 'crosshair',
        }),
      );
    }

    this.map.events.add('click', (event) => {
      if (this.locked) return;
      const coords = event.get('coords') as number[];
      this.setGuess([coords[0], coords[1]]);
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.map.container.fitToViewport();
      // Карта плавно меняет размер (мини-карта ↔ большая) — вписываем границы после анимации.
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.map.container.fitToViewport();
        if (this.autoFit) {
          void this.map.setBounds(this.autoFit.bounds, {
            checkZoomRange: true,
            zoomMargin: this.autoFit.margin,
          });
        }
      }, 230);
    });
    this.resizeObserver.observe(container);
    const stopAutoFit = () => {
      this.autoFit = null;
    };
    container.addEventListener('pointerdown', stopAutoFit);
    container.addEventListener('wheel', stopAutoFit, { passive: true });

    this.fitCity(false);
  }

  getGuess(): LatLng | null {
    return this.guess;
  }

  fitCity(animate = true): void {
    this.autoFit = { bounds: this.cityBounds, margin: 8 };
    this.map.container.fitToViewport();
    void this.map.setBounds(this.cityBounds, {
      checkZoomRange: true,
      zoomMargin: 8,
      duration: animate ? 300 : 0,
    });
  }

  /** Подготовка к новому раунду: без меток, по границам города. */
  reset(): void {
    this.clearResult();
    if (this.guessMark) {
      this.map.geoObjects.remove(this.guessMark);
      this.guessMark = null;
    }
    this.guess = null;
    this.locked = false;
    this.onGuessChange(null);
    this.fitCity(false);
  }

  /** Показывает реальную точку (красная), догадку (синяя) и линию между ними. */
  showResult(real: LatLng, guess: LatLng): void {
    this.locked = true;
    this.clearResult();

    if (this.guessMark) {
      this.guessMark.options.set('draggable', false);
      this.guessMark.geometry.setCoordinates(guess);
    }

    const line = new ymaps.Polyline([guess, real], {}, {
      strokeColor: '#1b1b1b',
      strokeWidth: 3,
      strokeOpacity: 0.85,
      strokeStyle: 'shortdash',
    });
    const realMark = new ymaps.Placemark(real, { hintContent: 'Место панорамы' }, {
      preset: REAL_PRESET,
    });

    this.resultObjects = [line, realMark];
    this.resultObjects.forEach((obj) => this.map.geoObjects.add(obj));

    const bounds = ymaps.util.bounds.fromPoints([real, guess]);
    this.autoFit = { bounds, margin: 60 };
    this.map.container.fitToViewport();
    void this.map.setBounds(bounds, {
      checkZoomRange: true,
      zoomMargin: 60,
      duration: 400,
    });
  }

  destroy(): void {
    window.clearTimeout(this.resizeTimer);
    this.resizeObserver.disconnect();
    this.map.destroy();
  }

  private setGuess(coords: LatLng): void {
    this.guess = coords;
    if (this.guessMark) {
      this.guessMark.geometry.setCoordinates(coords);
    } else {
      this.guessMark = new ymaps.Placemark(coords, { hintContent: 'Ваш ответ' }, {
        preset: GUESS_PRESET,
        draggable: true,
      });
      this.guessMark.events.add('dragend', () => {
        if (!this.guessMark || this.locked) return;
        const c = this.guessMark.geometry.getCoordinates();
        this.guess = [c[0], c[1]];
        this.onGuessChange(this.guess);
      });
      this.map.geoObjects.add(this.guessMark);
    }
    this.onGuessChange(coords);
  }

  private clearResult(): void {
    this.resultObjects.forEach((obj) => this.map.geoObjects.remove(obj));
    this.resultObjects = [];
  }
}
