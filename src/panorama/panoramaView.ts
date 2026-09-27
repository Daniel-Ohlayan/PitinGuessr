type MutablePanorama = ymaps.panorama.IPanorama & {
  getMarkers?: () => unknown[];
  setMarkers?: (markers: unknown[]) => void;
  __cpgStripped?: boolean;
};

/**
 * Убирает с панорамы маркеры с номерами домов и подписями — это прямые подсказки адреса.
 * Работает и для исходной панорамы, и для соседних, куда игрок переходит по стрелкам.
 */
function stripMarkers(panorama: ymaps.panorama.IPanorama | null | undefined): boolean {
  if (!panorama) return false;
  const p = panorama as MutablePanorama;
  if (p.__cpgStripped) return false;
  p.__cpgStripped = true;
  p.getMarkers = () => [];
  if (typeof p.setMarkers === 'function') p.setMarkers([]);
  return true;
}

/**
 * Плеер Яндекс.Панорам без подсказок: нет названия улицы/адреса, номеров домов
 * и ссылки «Открыть в Яндекс.Картах».
 */
export class PanoramaView {
  private player: ymaps.panorama.Player | null = null;

  constructor(private readonly container: HTMLElement) {}

  show(panorama: ymaps.panorama.IPanorama): void {
    this.destroyPlayer();
    stripMarkers(panorama);
    const player = new ymaps.panorama.Player(this.container, panorama, {
      // Только зум и полноэкранный режим. Контрол 'panoramaName' (адрес) не подключаем.
      controls: ['zoomControl', 'fullscreenControl'],
      suppressMapOpenBlock: true,
      hotkeysEnabled: true,
      scrollZoomBehavior: true,
      direction: [Math.round(Math.random() * 360), 0],
    });
    player.events.add('panoramachange', () => {
      const next = player.getPanorama();
      // Новая панорама пришла с маркерами — чистим и перерисовываем один раз.
      if (next && stripMarkers(next)) void player.setPanorama(next);
    });
    this.player = player;
  }

  destroy(): void {
    this.destroyPlayer();
  }

  private destroyPlayer(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.container.replaceChildren();
  }
}
