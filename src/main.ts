import './styles.css';
import { GAME_TITLE } from './config';
import { loadCity, loadRussiaGeometry } from './data/cities';
import { createCityRegion, createRussiaRegion, type GameRegion, type RegionSelection } from './game/region';
import { loadYmaps } from './map/ymapsLoader';
import { renderFinalScreen } from './ui/finalScreen';
import { renderGameScreen } from './ui/gameScreen';
import { renderStartScreen } from './ui/startScreen';

const root = document.getElementById('app') as HTMLElement;
document.title = GAME_TITLE;
let cleanup: (() => void) | null = null;
let lastSelection: RegionSelection | null = null;

function mount(render: () => () => void): void {
  cleanup?.();
  cleanup = render();
}

function goToStart(): void {
  mount(() =>
    renderStartScreen(root, {
      selectedId: lastSelection?.kind === 'city' ? lastSelection.cityId : null,
      mode: lastSelection?.kind ?? 'city',
      onPlay: startGame,
    }),
  );
}

async function loadRegion(selection: RegionSelection): Promise<GameRegion> {
  if (selection.kind === 'city') {
    return createCityRegion(await loadCity(selection.cityId));
  }
  return createRussiaRegion(await loadRussiaGeometry());
}

function startGame(selection: RegionSelection): void {
  lastSelection = selection;
  mount(() =>
    renderGameScreen(root, () => loadRegion(selection), {
      onExit: goToStart,
      onFinish: (session) =>
        mount(() =>
          renderFinalScreen(root, session, {
            onReplay: () => startGame(selection),
            onChangeCity: goToStart,
          }),
        ),
    }),
  );
}

goToStart();
// Заранее подгружаем API, пока пользователь выбирает город.
loadYmaps().catch(() => undefined);
