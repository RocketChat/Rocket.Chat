import breakpointsTokens from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import { useMemo } from 'react';

import { useMediaQueries } from './useMediaQueries';

const breakpoints = Object.entries(breakpointsTokens)
	.map(([name, { minViewportWidth }]) => ({
		name,
		minViewportWidth,
	}))
	.sort((a, b) => (a.minViewportWidth ?? 0) - (b.minViewportWidth ?? 0));

/**
 * Hook to catch which responsive design' breakpoints are active.
 *
 * @returns an array of the active breakpoint names
 * @public
 */
export const useBreakpoints = (unit: 'px' | 'em' = 'em'): string[] => {
	const matches = useMediaQueries(
		...useMemo(
			() =>
				breakpoints
					.slice(1)
					.map(({ minViewportWidth }) => `(min-width: ${unit === 'px' ? `${minViewportWidth}px` : `${minViewportWidth! / 16}em`})`),
			[unit],
		),
	);

	return useMemo(
		() =>
			matches.reduce<string[]>(
				(names, matches, i) => {
					if (matches) {
						return [...names, breakpoints[i + 1].name];
					}

					return names;
				},
				[breakpoints[0].name],
			),
		[matches],
	);
};
