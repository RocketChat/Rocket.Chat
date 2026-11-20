import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { fontScale, radius, size, space, themed } from './lib/tokens.mts';

const generate = () => {
	// The chip has no border, so no state sets a border color
	const enabled = {
		cursor: 'pointer',
		color: themed('font-secondary-info'),
		backgroundColor: {
			'default': themed('button-background-secondary-default'),
			'focus-visible': themed('button-background-secondary-focus'),
			'hover': themed('button-background-secondary-hover'),
			'press': themed('button-background-secondary-press'),
		},
		boxShadow: {
			'focus-visible': `0 0 0 2px ${themed('stroke-extra-light-highlight')}`,
			'hover': 'none',
			'press': 'none',
		},
	};

	// Disabled keeps the resting colors of the secondary Button, whatever the chip's own are
	const disabled = {
		cursor: 'not-allowed',
		color: themed('button-font-on-secondary'),
		backgroundColor: themed('button-background-secondary-default'),
	};

	const frame: Record<string, Value> = {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'center',
		minWidth: 'auto',
		overflow: 'hidden',
		padding: space('x4'),
		gap: space('x8'),
		outlineStyle: 'none',
		borderWidth: 0,
		borderStyle: 'solid',
		borderRadius: radius('medium'),
		fontVariantNumeric: 'tabular-nums',
	};

	const text: Record<string, Value> = {
		boxSizing: 'border-box',
		flexShrink: 1,
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		// A Text frame breaks words by default in the zero build and not in the runtime one
		wordWrap: 'normal',
		textOverflow: 'ellipsis',
		color: 'inherit',
		fontFamily: 'inherit',
		...fontScale('p2'),
		fontVariantNumeric: 'tabular-nums',
		outlineStyle: 'none',
	};

	const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

	return [
		constant('chipFrame', frame),
		constant('chipEnabled', enabled),
		constant('chipDisabled', disabled),
		constant('chipRegular', { height: size('x28'), minHeight: size('x28') }),
		constant('chipSmall', { height: size('x20'), minHeight: size('x20') }),
		constant('chipText', text),
	].join('\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Chip/Chip.tsx'), generate }] satisfies Target[];
