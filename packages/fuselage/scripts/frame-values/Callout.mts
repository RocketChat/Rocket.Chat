import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import { statusPalettes, statusTones } from './lib/statusPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Callout', file);

const generateCallout = () => {
	const palettes = statusPalettes();
	const color = (tone: (typeof statusTones)[number]) => themed(`callout-${tone}-color`, palettes[tone].font);

	const frame = {
		render: 'section',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		padding: spacing('x12')!,
		color: themed('callout-text-color', textIconColor('font-default')),
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderRadius: themed('callout-border-radius', themed('border-radius-medium', borderRadius('medium'))),
		backgroundColor: themed('callout-background-color', surfaceColors['surface-light'].toString()),
	};

	const tones = {
		default: { borderColor: themed('callout-default-color', textIconColor('font-secondary-info')) },
		...Object.fromEntries(statusTones.map((tone) => [tone, { borderColor: color(tone) }])),
	};

	// What a plain `div` does where a frame's defaults are a column's: it fills its parent and shrinks with it
	const block = {
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexBasis: 'auto',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
	};

	const body = {
		render: 'div',
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 'auto',
		minHeight: 'auto',
		overflow: 'hidden',
		marginInlineStart: spacing('x12')!,
	};

	const layouts = {
		stacked: { display: 'flex', flexDirection: 'column', alignItems: 'normal', gap: spacing('x12')! },
		inline: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
		},
	};

	const text = {
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		overflow: 'hidden',
		gap: spacing('x4')!,
	};

	const title = { ...block, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...font('p2b') };
	const content = { ...block, ...font('p2') };

	return [
		`const calloutFrame = ${literal(frame)} as const;`,
		`const calloutTones = ${literal(tones)} as const;`,
		`const calloutCentered = ${literal({ alignItems: 'center' })} as const;`,
		`const calloutBody = ${literal(body)} as const;`,
		`const calloutLayouts = ${literal(layouts)} as const;`,
		`const calloutText = ${literal(text)} as const;`,
		`const calloutTitle = ${literal({ ...textFrameDefaults(title), ...title })} as const;`,
		`const calloutContent = ${literal({ ...textFrameDefaults(content), ...content })} as const;`,
		`const calloutActions = ${literal({ render: 'div', ...block })} as const;`,
	].join('\n\n');
};

// The icon's colour follows the callout's tone through a modifier class on the `Icon` the callout renders
const generateCalloutCss = () => {
	const palettes = statusPalettes();
	return statusTones
		.map((tone) => `.rcx-callout__icon--${tone} {\n\tcolor: ${themed(`callout-${tone}-color`, palettes[tone].font)};\n}`)
		.join('\n\n');
};

export default [
	{ file: component('Callout.tsx'), generate: generateCallout },
	{ file: component('Callout.styles.css'), generate: generateCalloutCss, css: true },
] satisfies Target[];
