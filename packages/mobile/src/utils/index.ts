export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
