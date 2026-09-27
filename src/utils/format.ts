export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} км`;
}

export function formatScore(score: number): string {
  return Math.round(score).toLocaleString('ru-RU');
}

export function pluralizePoints(score: number): string {
  const n = Math.abs(Math.round(score)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return 'очков';
  if (n1 === 1) return 'очко';
  if (n1 >= 2 && n1 <= 4) return 'очка';
  return 'очков';
}
