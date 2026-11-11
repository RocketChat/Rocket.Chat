import { join } from 'node:path';

import { buttonBackground, kindColors, kinds } from './lib/buttonPalettes.mts';
import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { strokeColors, textIconColors } from '../../src/Theme.ts';
import { toCSSValue } from '../../src/helpers/toCSSValue.ts';
import { borderRadius, borderWidth, fontFamily, fontScale, size, spacing } from '../../src/styleTokens.ts';

const themed = (name: string, value: string) => toCSSValue(`--rcx-${name}`, value);
const secondary = (state: string) => buttonBackground('secondary', state);

const generate = () => {
	const palette = kindColors('secondary', kinds.secondary);
	const background = (name: string, value: string) => themed(`chip-${name}background-color`, value);
	const shadow = themed('chip-focus-shadow-color', strokeColors['stroke-extra-light-highlight'].toString());

	// The border colors of every state are left out: the chip has no border
	const enabled = {
		cursor: 'pointer',
		color: themed('chip-color', textIconColors['font-secondary-info'].toString()),
		backgroundColor: {
			'default': background('', secondary('default')),
			'focus-visible': background('focus-', secondary('focus')),
			'hover': background('hover-', secondary('hover')),
			'press': background('active-', secondary('press')),
		},
		boxShadow: {
			'focus-visible': `0 0 0 ${borderWidth('medium')} ${shadow}`,
			'hover': 'none',
			'press': 'none',
		},
	};

	// Disabled keeps the secondary Button's colors, whatever the chip's own are
	const disabled = {
		cursor: 'not-allowed',
		color: palette.color,
		backgroundColor: palette.background,
	};

	const frame: Record<string, Value> = {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'center',
		minWidth: 'auto',
		maxWidth: 'var(--rcx-chip-max-width, none)',
		overflow: 'hidden',
		margin: 0,
		padding: spacing('x4')!,
		gap: spacing('x8')!,
		outlineStyle: 'none',
		borderWidth: 0,
		borderStyle: 'solid',
		borderRadius: toCSSValue('--rcx-button-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
		fontFamily: fontFamily('sans'),
		...fontScale('p2'),
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
		letterSpacing: 'inherit',
		color: 'inherit',
		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		lineHeight: 'inherit',
		fontVariantNumeric: 'tabular-nums',
		outlineStyle: 'none',
	};

	// The default thumb wraps the avatar in a box that lays out like one
	const thumb: Record<string, Value> = {
		render: 'div',
		display: 'inline-flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		verticalAlign: 'middle',
	};

	const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

	return [
		constant('chipFrame', frame),
		constant('chipEnabled', enabled),
		constant('chipDisabled', disabled),
		constant('chipRegular', { height: size('x28')!, minHeight: size('x28')! }),
		constant('chipSmall', { height: size('x20')!, minHeight: size('x20')! }),
		constant('chipText', text),
		constant('chipThumb', thumb),
	].join('\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Chip/Chip.tsx'), generate }] satisfies Target[];
