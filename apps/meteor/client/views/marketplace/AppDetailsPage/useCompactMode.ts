import { useBreakpoints } from '@rocket.chat/fuselage-hooks';

export const useCompactMode = () => {
	const breakpoint = useBreakpoints();
	return !breakpoint.includes('lg');
};
