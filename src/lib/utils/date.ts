/**
 * Returns the week-ending date (Sunday) as YYYY-MM-DD string.
 * If today is Sunday, returns today. Otherwise returns the coming Sunday.
 */
export function getCurrentWeekEnding(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  return sunday.toISOString().split("T")[0];
}
