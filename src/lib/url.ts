/**
 * Root-relative links that respect Astro's `base`.
 * Slate serves the site at "/". Catalyst Cloud Scale web-client hosting serves it under "/app/"
 * (build with BASE_PATH=/app) and does not resolve folder URLs to their index.html — "/app/resume/"
 * is a 404 there while "/app/resume/index.html" works. So in that build, page links get an explicit
 * index.html. Every internal link and public asset goes through withBase().
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Only the Catalyst web-client build has a base path. */
const EXPLICIT_INDEX = BASE !== '';

/** "/app/projects/setu/#x" → "/app/projects/setu/index.html#x" (the site root stays "/app/"). */
export function pagePath(path: string): string {
  if (!EXPLICIT_INDEX) return path;
  const m = /^([^?#]*)(.*)$/.exec(path);
  const dir = m?.[1] ?? path;
  const rest = m?.[2] ?? '';
  if (!dir.endsWith('/') || dir === `${BASE}/`) return path;
  return `${dir}index.html${rest}`;
}

export const withBase = (path: string): string =>
  path.startsWith('/') && !path.startsWith('//') ? pagePath(`${BASE}${path}`) : path;
