import { useMediaQuery } from './useMediaQuery';

/**
 * Hook to get the prefers-reduce-motion value.
 *
 * @returns `true` if the prefers-reduce-motion is set reduce in the media queries that matches
 * @public
 */
export const usePrefersReducedMotion = (): boolean => useMediaQuery('(prefers-reduced-motion: reduce)');
