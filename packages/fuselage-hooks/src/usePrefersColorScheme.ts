import { useMediaQuery } from './useMediaQuery';

/**
 * Hook to get the prefers-color-scheme value.
 *
 * @returns `true` if the prefers-color-scheme matches
 * @public
 */
export const usePrefersColorScheme = (scheme?: string): boolean => useMediaQuery(`(prefers-color-scheme: ${!scheme ? 'light' : scheme})`);
