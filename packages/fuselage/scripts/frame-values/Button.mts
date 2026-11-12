import { join } from 'node:path';

import {
	buttonChrome,
	disabledStyle,
	font,
	paintStyle,
	segmentRaise,
	segmentVariants,
	squareLayout,
	squaredSize,
} from './lib/buttonFrames.mts';
import { kindColors, kinds } from './lib/buttonPalettes.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { offScale } from './lib/tokens.mts';
import { fontFamily, size, spacing, type FontScaleName } from '../../src/styleTokens.ts';

const component = (name: string, file: string) => join(import.meta.dirname, '../../src/components', name, file);

const camelName = (kind: string) => kind.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

const lineHeightOf = (scale: FontScaleName) => (font(scale) as { lineHeight: string }).lineHeight;

const rectangularSize = (height: number, paddingX: number, lineHeightScale: FontScaleName) => ({
	minWidth: `calc(${size(`x${height}`)} * 2)`,
	height: size(`x${height}`)!,
	paddingBlock: `calc((${size(`x${height}`)} - ${lineHeightOf(lineHeightScale)}) / 2 - ${offScale(2)})`,
	paddingInline: `calc(${spacing(`x${paddingX}`)} - ${offScale(2)})`,
});

const generateButton = () => {
	const out: string[] = [];
	const constant = (name: string, value: Value) => out.push(`const ${name} = ${literal(value)};`);

	for (const [kind, shadow] of Object.entries(kinds)) {
		const colors = kindColors(kind, shadow);
		constant(camelName(kind), paintStyle(colors));
		constant(`${camelName(kind)}Disabled`, disabledStyle(colors));
	}

	constant('smallFont', font('c2'));
	constant('largeFont', font('p2'));

	const compact = { minWidth: '4ch' };
	const small = rectangularSize(28, 8, 'c1');
	const medium = rectangularSize(32, 12, 'c1');
	const large = rectangularSize(48, 24, 'p2');
	constant('compactBox', compact);
	constant('smallBox', small);
	constant('smallCompactBox', { ...small, ...compact });
	constant('mediumBox', medium);
	constant('mediumCompactBox', { ...medium, ...compact });
	constant('largeBox', large);
	constant('largeCompactBox', { ...large, ...compact });

	for (const [name, side] of Object.entries({ Square: 40, MiniSquare: 20, TinySquare: 24, SmallSquare: 28, MediumSquare: 32 })) {
		constant(`${camelName(name[0].toLowerCase() + name.slice(1))}Box`, squaredSize(side));
	}

	constant('squareLayout', squareLayout);
	constant('segment', segmentVariants);
	constant('segmentRaise', segmentRaise);

	constant('frame', {
		render: 'button',
		display: 'inline-block',
		flexShrink: 1,
		alignItems: 'normal',
		fontFamily: fontFamily('sans'),
		fontVariantNumeric: 'tabular-nums',
		...font('p2m'),
		...rectangularSize(40, 16, 'p2'),
		...buttonChrome,
	});

	out.push(
		`const content = ${literal({
			render: 'span',
			display: 'inline-block',
			width: '100%',
			verticalAlign: 'top',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			wordWrap: 'inherit',
			transform: { 'default': 'none', 'group-press/button': 'translateY(1px)' },
		})};`,
	);

	return out.join('\n\n');
};

const generateButtonCss = () => `.rcx-button__icon {
	margin-inline-end: ${spacing('x4')};
}`;

export default [
	{ file: component('Button', 'Button.tsx'), generate: generateButton },
	{ file: component('Button', 'Button.styles.css'), generate: generateButtonCss, css: true },
] satisfies Target[];
