import { profile } from '../data/profile';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2024-11' → 'Nov 2024' · '2024' → '2024' */
export function formatMonth(ym: string | null | undefined): string | null {
  if (!ym) return null;
  const [year, month] = ym.split('-').map(Number);
  return month ? `${MONTHS[month - 1]} ${year}` : String(year);
}

/** Period label. An unknown start is shown as "Until <end>". */
export function formatPeriod(start: string | null | undefined, end: string | null | undefined): string {
  const s = formatMonth(start);
  const e = end ? formatMonth(end) : 'Present';
  return s ? `${s} – ${e}` : `Until ${e}`;
}

function monthsBetween(start: string, end: Date): number {
  const [y, m] = start.split('-').map(Number);
  return (end.getFullYear() - y) * 12 + (end.getMonth() + 1 - (m || 1));
}

/** '2024-11' → '2 yrs' / '1 yr 3 mos' (calculated at build time). */
export function durationLabel(start: string | null, end: string | null, now = new Date()): string | null {
  if (!start) return null;
  const endDate = end ? new Date(Number(end.slice(0, 4)), Number(end.slice(5, 7)) - 1) : now;
  const total = Math.max(1, monthsBetween(start, endDate) + (end ? 1 : 0));
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
  return parts.join(' ');
}

/**
 * Total experience in half-year steps, rounded down, so it never overstates.
 * Uses `firstRoleStart` when Pankaj provides it; otherwise his stated number (decision D5).
 */
export function experienceYears(now = new Date()): number {
  const { firstRoleStart, years } = profile.experience;
  if (!firstRoleStart) return years;
  return Math.floor(monthsBetween(firstRoleStart, now) / 6) / 2;
}

export function experienceLabel(now = new Date()): string {
  return `${experienceYears(now)}+ years`;
}
