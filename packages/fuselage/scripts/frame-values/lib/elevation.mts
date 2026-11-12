import type { Value } from './literal.mts';
import { shadowColors } from '../../../src/Theme.ts';
import { borderWidth } from '../../../src/styleTokens.ts';

export const elevationLevels = ['0', '1', '2', '1nb', '2nb'] as const;

export type ElevationLevel = (typeof elevationLevels)[number];

const shadow = (name: keyof typeof shadowColors) => shadowColors[name].toString();

/** The shadow of each elevation level, with a border unless the level is `nb` (no border). */
export const elevation = (): Record<ElevationLevel, Value> => {
	const one = `0px 0px 12px 0px ${shadow('shadow-elevation-1')}`;
	const two = `0px 0px 2px 0px ${shadow('shadow-elevation-2x')}, 0px 0px 12px 0px ${shadow('shadow-elevation-2y')}`;
	const border = { borderWidth: borderWidth('default'), borderStyle: 'solid', borderColor: shadow('shadow-elevation-border') };

	return {
		'0': { boxShadow: 'none' },
		'1': { boxShadow: one, ...border },
		'2': { boxShadow: two, ...border },
		'1nb': { boxShadow: one },
		'2nb': { boxShadow: two },
	};
};
