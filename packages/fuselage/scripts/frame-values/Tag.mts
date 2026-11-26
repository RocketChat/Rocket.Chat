import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, radius, space, themed } from './lib/tokens.mts';

type ThemeKey = Parameters<typeof themed>[0];

type Tone = { color: ThemeKey; background: ThemeKey; hover: ThemeKey };

const neutral: Tone = {
	color: 'button-font-on-secondary',
	background: 'button-background-secondary-default',
	hover: 'button-background-secondary-hover',
};

// The secondary tones that only recolor the text keep the secondary fill
const tones: Record<string, Tone> = {
	'default': neutral,
	'primary': { color: 'button-font-on-primary', background: 'button-background-primary-default', hover: 'button-background-primary-hover' },
	'secondary': neutral,
	'danger': { color: 'button-font-on-danger', background: 'button-background-danger-default', hover: 'button-background-danger-hover' },
	'warning': { color: 'button-font-on-warning', background: 'button-background-warning-default', hover: 'button-background-warning-hover' },
	'featured': { color: 'button-font-on-primary', background: 'surface-featured', hover: 'surface-featured-hover' },
	'secondary-danger': {
		color: 'button-font-on-secondary-danger',
		background: 'button-background-secondary-danger-default',
		hover: 'button-background-secondary-danger-hover',
	},
	'secondary-warning': { ...neutral, color: 'status-font-on-warning' },
	'secondary-info': { ...neutral, color: 'status-font-on-info' },
};

const generate = () => {
	const frame: Record<string, Value> = {
		render: 'span',
		display: 'flex',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 'auto',
		minHeight: 'auto',
		overflow: 'hidden',
		paddingBlock: offScale(2),
		paddingInline: space('x4'),
		gap: space('x4'),
		whiteSpace: 'nowrap',
		textDecoration: 'none',
		textOverflow: 'ellipsis',
		wordBreak: 'keep-all',
		outlineStyle: 'none',
		borderWidth: 1,
		borderStyle: 'solid',
		borderColor: { 'default': 'transparent', 'focus-visible': themed('stroke-highlight') },
		boxShadow: { 'focus-visible': `0 0 0 2px ${themed('stroke-extra-light-highlight')}` },
		...fontScale('micro'),
	};

	// A tag that is clickable and disabled keeps the colors of its tone, and only the resting fill is the muted one
	const muted = { color: themed('font-secondary-info'), background: themed('surface-neutral') };
	const paints = Object.fromEntries(
		Object.entries(tones).flatMap(([name, tone]) => {
			const color = themed(tone.color);
			const background = themed(tone.background);
			const hover = themed(tone.hover);

			return [
				[`${name}|rest`, { color, backgroundColor: background }],
				[`${name}|clickable`, { cursor: 'pointer', color, backgroundColor: { default: background, hover } }],
				[`${name}|muted`, { cursor: 'not-allowed', color: muted.color, backgroundColor: muted.background }],
				[`${name}|clickable-disabled`, { cursor: 'not-allowed', color, backgroundColor: { default: muted.background, hover } }],
			];
		}),
	);

	// The focused outline is rounder than the resting one, whatever the shape
	const shapes = {
		regular: { borderRadius: { 'default': radius('small'), 'focus-visible': radius('medium') } },
		pill: { borderRadius: { 'default': radius('full'), 'focus-visible': radius('medium') } },
	};

	const scales = { medium: fontScale('c2'), large: fontScale('p2b') };

	const inner: Record<string, Value> = {
		render: 'span',
		overflow: 'hidden',
		minWidth: 0,
		whiteSpace: 'nowrap',
		// A Text frame breaks words by default in the zero build and not in the runtime one
		wordWrap: 'normal',
		textOverflow: 'ellipsis',
		fontFamily: 'inherit',
	};

	const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

	return [
		constant('tagFrame', { ...textFrameDefaults(frame), ...frame }),
		constant('tagPaints', paints),
		constant('tagShapes', shapes),
		constant('tagScales', scales),
		constant('tagInner', inner),
	].join('\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Tag/Tag.tsx'), generate }] satisfies Target[];
