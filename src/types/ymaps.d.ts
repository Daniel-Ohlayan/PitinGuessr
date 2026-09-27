/**
 * Минимальные типы для используемой части Yandex Maps JS API 2.1.
 * Объект `ymaps` появляется в глобальной области после загрузки скрипта API.
 */
declare namespace ymaps {
  type Coords = [number, number];
  type Bounds = [Coords, Coords];

  function ready(): Promise<void>;

  interface IEvent {
    get(name: string): any;
  }

  interface IEventManager {
    add(types: string | string[], callback: (event: IEvent) => void): IEventManager;
    remove(types: string | string[], callback: (event: IEvent) => void): IEventManager;
  }

  interface IOptionManager {
    set(key: string, value: unknown): IOptionManager;
  }

  interface IGeoObject {
    events: IEventManager;
    options: IOptionManager;
  }

  interface IPointGeometry {
    getCoordinates(): number[];
    setCoordinates(coords: number[]): void;
  }

  interface GeoObjectCollection {
    add(object: IGeoObject): GeoObjectCollection;
    remove(object: IGeoObject): GeoObjectCollection;
    removeAll(): GeoObjectCollection;
  }

  interface MapState {
    center: number[];
    zoom: number;
    controls?: string[];
    type?: string;
  }

  interface SetBoundsOptions {
    checkZoomRange?: boolean;
    zoomMargin?: number | number[];
    duration?: number;
  }

  class Map {
    constructor(element: HTMLElement | string, state: MapState, options?: Record<string, unknown>);
    geoObjects: GeoObjectCollection;
    events: IEventManager;
    container: { fitToViewport(): void };
    setBounds(bounds: number[][], options?: SetBoundsOptions): Promise<void>;
    destroy(): void;
  }

  class Placemark implements IGeoObject {
    constructor(coords: number[], properties?: Record<string, unknown>, options?: Record<string, unknown>);
    geometry: IPointGeometry;
    events: IEventManager;
    options: IOptionManager;
  }

  class Polyline implements IGeoObject {
    constructor(coords: number[][], properties?: Record<string, unknown>, options?: Record<string, unknown>);
    events: IEventManager;
    options: IOptionManager;
  }

  class Polygon implements IGeoObject {
    constructor(coords: number[][][], properties?: Record<string, unknown>, options?: Record<string, unknown>);
    events: IEventManager;
    options: IOptionManager;
  }

  namespace util {
    namespace bounds {
      function fromPoints(points: number[][]): number[][];
    }
  }

  namespace panorama {
    interface IPanorama {
      getPosition(): number[];
    }

    interface LocateOptions {
      layer?: 'yandex#panorama' | 'yandex#airPanorama';
    }

    function locate(point: number[], options?: LocateOptions): Promise<IPanorama[]>;
    function isSupported(): boolean;

    class Player {
      constructor(element: HTMLElement | string, panorama: IPanorama | number[], options?: Record<string, unknown>);
      events: IEventManager;
      setDirection(direction: number[] | string): Promise<void>;
      getPanorama(): IPanorama | null;
      setPanorama(panorama: IPanorama): Promise<void>;
      destroy(): void;
    }
  }
}

interface Window {
  ymaps?: typeof ymaps;
}
