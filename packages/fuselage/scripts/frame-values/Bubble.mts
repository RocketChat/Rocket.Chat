import { join } from 'node:path';

import { buttonChrome, disabledStyle, paintStyle } from './lib/buttonFrames.mts';
import { kindColors, kinds } from './lib/buttonPalettes.mts';
import { font, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderRadius, fontFamily, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Bubble', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const kindNames = ['primary', 'secondary'] as const;

// What a button and a static item of the bubble state alike: the same pill, height and type
const pill = () => ({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 1,
	height: size('x28')!,
	paddingInlineStart: spacing('x8')!,
	paddingInlineEnd: spacing('x8')!,
	borderRadius: themed('border-radius-extra-large', borderRadius('extra-large')),
	...font('c2'),
});

// The variants a button and an item share: the small size, the end padding a leading icon asks for, and the corners of a group
const small = { true: { height: size('x20')!, ...font('micro') }, false: {} };
const trailing = { true: { paddingInlineEnd: spacing('x12')! }, false: {} };
const segments = {
	first: { borderStartEndRadius: 0, borderEndEndRadius: 0 },
	last: { borderStartStartRadius: 0, borderEndStartRadius: 0 },
	only: {},
};

const generateBubble = () =>
	constant('bubbleFrame', webDefaults({ render: 'div', display: 'flex', overflow: 'hidden', alignItems: 'center' }));

const generateButton = () => {
	const frame = webDefaults({
		render: 'button',
		fontFamily: fontFamily('sans'),
		fontVariantNumeric: 'tabular-nums',
		...pill(),
		paddingBlock: 0,
		appearance: 'none',
		...buttonChrome,
		borderRadius: pill().borderRadius,
	});

	const paint = Object.fromEntries(
		kindNames.flatMap((kind) => {
			const colors = kindColors(kind, kinds[kind]);
			return [
				[kind, paintStyle(colors)],
				[`${kind}-disabled`, disabledStyle(colors)],
			];
		}),
	);

	return [
		constant('buttonFrame', frame),
		constant('buttonPaint', paint),
		constant('buttonSmall', small),
		constant('buttonTrailing', trailing),
		constant('buttonSegments', segments),
	].join('\n\n');
};

// The label and the icon move together under the press: one frame holds both, as the content of a Button does
const generateContent = () => {
	const content = webDefaults({
		render: 'span',
		display: 'flex',
		alignItems: 'center',
		overflow: 'hidden',
		columnGap: spacing('x4')!,
		transform: { 'default': 'none', 'group-press/bubble': 'translateY(1px)' },
	});

	return constant('contentFrame', { ...textFrameDefaults(content), ...content });
};

const label = () => {
	const frame = webDefaults({
		render: 'span',
		display: 'block',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	});

	return { ...textFrameDefaults(frame), ...frame };
};

const generateLabel = () => constant('labelFrame', label());

const generateItem = () => {
	const frame = webDefaults({
		render: 'span',
		...pill(),
		columnGap: spacing('x12')!,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	});

	const paint = Object.fromEntries(
		kindNames.map((kind) => {
			const colors = kindColors(kind, kinds[kind]);
			return [kind, { color: colors.color, backgroundColor: colors.background }];
		}),
	);

	return [
		constant('itemFrame', frame),
		constant('itemPaint', paint),
		constant('itemSmall', small),
		constant('itemTrailing', trailing),
		constant('itemSegments', segments),
	].join('\n\n');
};

const targets: Target[] = [
	{ file: component('Bubble.tsx'), generate: generateBubble },
	{ file: component('BubbleButton.tsx'), generate: generateButton },
	{ file: component('BubbleContent.tsx'), generate: generateContent },
	{ file: component('BubbleLabel.tsx'), generate: generateLabel },
	{ file: component('BubbleItem.tsx'), generate: generateItem },
];

export default targets;
