import { join } from 'node:path';

import {
	buttonChrome,
	disabledPaint,
	kindColors,
	kinds,
	paintStyle,
	pressNudge,
	segmentCorners,
	segmentRaise,
	squareLayout,
	squaredSize,
} from './lib/buttonFrames.mts';
import type { Kind } from './lib/buttonFrames.mts';
import { literal } from './lib/literal.mts';
import type { Rem, Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { ch, fontScale, percent, rem, size } from './lib/tokens.mts';
import { tokens } from '../../src/tamagui.tokens.ts';

const BORDER_AND_FOCUS_ROOM = 2;

// The paddings are pixels, as every padding of a frame is: the stylesheet derived the block one from the height and the
// line height, which follow the font size of the page
const onScale = (pixels: number) =>
	Object.hasOwn(tokens.size, `x${pixels}`) ? size(`x${pixels}` as keyof typeof tokens.size) : rem(pixels);

const rectangularSize = (height: number, paddingInline: keyof typeof tokens.space, lineHeight: Rem) => ({
	minWidth: onScale(height * 2),
	height: onScale(height),
	paddingBlock: (height - lineHeight.pixels) / 2 - BORDER_AND_FOCUS_ROOM,
	paddingInline: tokens.space[paddingInline] - BORDER_AND_FOCUS_ROOM,
});

const generateButton = () => {
	const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

	const paints = Object.fromEntries(
		(Object.keys(kinds) as Kind[]).flatMap((kind) => [
			[kind, paintStyle(kindColors(kind))],
			[`${kind}-disabled`, disabledPaint(kindColors(kind))],
		]),
	);

	const small = rectangularSize(28, 'x8', fontScale('c1').lineHeight);
	const medium = rectangularSize(32, 'x12', fontScale('c1').lineHeight);
	const large = rectangularSize(48, 'x24', fontScale('p2').lineHeight);

	return [
		constant('buttonFrame', {
			render: 'button',
			display: 'inline-block',
			flexShrink: 1,
			alignItems: 'normal',
			fontVariantNumeric: 'tabular-nums',
			...fontScale('p2m'),
			...rectangularSize(40, 'x16', fontScale('p2').lineHeight),
			...buttonChrome,
		}),
		constant('buttonPaints', paints),
		constant('buttonFonts', { small: fontScale('c2'), large: fontScale('p2') }),
		constant('buttonSmall', small),
		constant('buttonMedium', medium),
		constant('buttonLarge', large),
		constant('buttonSquares', {
			'square': squaredSize('x40'),
			'mini-square': squaredSize('x20'),
			'tiny-square': squaredSize('x24'),
			'small-square': squaredSize('x28'),
			'medium-square': squaredSize('x32'),
		}),
		constant('buttonCompact', { minWidth: ch(4) }),
		constant('buttonSquare', squareLayout),
		constant('buttonSegments', segmentCorners),
		constant('buttonSegmentRaise', segmentRaise),
		constant('buttonContentPaints', Object.fromEntries(Object.entries(paints).map(([paint, { color }]) => [paint, { color }]))),
		constant('buttonContent', {
			render: 'span',
			display: 'inline-block',
			verticalAlign: 'top',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			wordWrap: 'inherit',
			// A Text frame does not take it from the button as an element of the page does
			textAlign: 'center',
			width: percent(100),
			...pressNudge,
		}),
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Button/Button.tsx'), generate: generateButton }];

export default targets;
