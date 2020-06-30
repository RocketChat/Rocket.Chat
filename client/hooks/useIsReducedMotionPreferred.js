import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

export const useIsReducedMotionPreferred = () => useMediaQuery('(prefers-reduced-motion: reduce)');
