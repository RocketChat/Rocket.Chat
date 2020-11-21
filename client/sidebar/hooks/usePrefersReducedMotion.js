import { useMediaQueries } from '@rocket.chat/fuselage-hooks';


export const usePrefersReducedMotion = () => useMediaQueries('(prefers-reduced-motion: reduce)')[0];
