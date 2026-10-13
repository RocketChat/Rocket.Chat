import { useEffect, useLayoutEffect } from 'react';

/**
 * Replacement for the `useEffect` hook that is safely ignored on SSR.
 *
 * @public
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
