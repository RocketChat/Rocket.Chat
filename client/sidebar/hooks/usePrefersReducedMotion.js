import { useMediaQueries } from '@rocket.chat/fuselage-hooks';


export const usePrefersReducedMotion = () => {
	console.log(useMediaQueries('(prefers-reduced-motion: reduce)')[0]);
	return useMediaQueries('(prefers-reduced-motion: reduce)')[0];
};
