import { distanceMeters, type LatLng } from '../utils/geo';
import type { GameRegion } from './region';
import { calculateScore, MAX_ROUND_SCORE } from './scoring';

export const TOTAL_ROUNDS = 5;

export interface RoundResult {
  round: number;
  real: LatLng;
  guess: LatLng;
  distance: number;
  score: number;
}

/** Состояние одной игры (в памяти). */
export class GameSession {
  readonly totalRounds = TOTAL_ROUNDS;
  readonly maxTotalScore = TOTAL_ROUNDS * MAX_ROUND_SCORE;
  readonly results: RoundResult[] = [];
  private currentRound = 0;
  private currentReal: LatLng | null = null;

  constructor(readonly region: GameRegion) {}

  get round(): number {
    return this.currentRound;
  }

  get totalScore(): number {
    return this.results.reduce((sum, r) => sum + r.score, 0);
  }

  get averageDistance(): number {
    if (!this.results.length) return 0;
    return this.results.reduce((sum, r) => sum + r.distance, 0) / this.results.length;
  }

  get isLastRound(): boolean {
    return this.currentRound >= this.totalRounds;
  }

  get isFinished(): boolean {
    return this.results.length >= this.totalRounds;
  }

  /** Позиции уже использованных панорам — чтобы не повторяться. */
  get usedPositions(): LatLng[] {
    const used = this.results.map((r) => r.real);
    if (this.currentReal) used.push(this.currentReal);
    return used;
  }

  nextRound(): number {
    if (this.currentRound >= this.totalRounds) {
      throw new Error('Все раунды уже сыграны');
    }
    this.currentRound++;
    this.currentReal = null;
    return this.currentRound;
  }

  setPanoramaPosition(position: LatLng): void {
    this.currentReal = position;
  }

  submitGuess(guess: LatLng): RoundResult {
    if (!this.currentReal) {
      throw new Error('Панорама раунда ещё не загружена');
    }
    const distance = distanceMeters(this.currentReal, guess);
    const result: RoundResult = {
      round: this.currentRound,
      real: this.currentReal,
      guess,
      distance,
      score: calculateScore(distance, this.region.mapSize),
    };
    this.results.push(result);
    this.currentReal = null;
    return result;
  }
}
