import { useMediaQuery } from './useMediaQuery.js';

/**
 * Hook to get the prefers-reduce-data value.
 *
 * @returns `true` if the prefers-reduce-data is set reduce in the media queries that matches
 * @public
 */
export const usePrefersReducedData = (): boolean => useMediaQuery('(prefers-reduced-data: reduce)');
