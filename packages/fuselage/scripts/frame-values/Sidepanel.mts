import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { backgroundColor, borderWidth, fontColor, size, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidepanel', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateSidepanel = () =>
	constant(
		'sidepanelFrame',
		webDefaults({
			render: 'div',
			display: 'flex',
			flexDirection: 'column',
			flexGrow: 1,
			flexShrink: 0,
			flexBasis: 'auto',
			height: size('full')!,
			color: fontColor('default'),
			borderTopWidth: 0,
			borderRightWidth: borderWidth('default'),
			borderBottomWidth: 0,
			borderLeftWidth: borderWidth('default'),
			borderStyle: 'solid',
			borderColor: strokeColor('light'),
			backgroundColor: backgroundColor('sidebar'),
		}),
	);

const bar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing('x8')! };

// A header and a section hold the consumer's text as well as its elements, so their frames are Text
const textFrame = (style: Record<string, Value>) => {
	const frame = webDefaults(style);
	return { ...textFrameDefaults(frame), ...frame };
};

const generateSidepanelSection = () => constant('sidepanelSectionFrame', textFrame({ render: 'div', ...bar, padding: spacing('x16')! }));

// The negative margin pulls the flush divider that follows up into the header: the header's own optical value
const generateSidepanelHeader = () =>
	constant(
		'sidepanelHeaderFrame',
		textFrame({
			render: 'div',
			...bar,
			height: size('x44')!,
			marginBlockEnd: offScale(-2),
			paddingInline: spacing('x16')!,
		}),
	);

const generateSidepanelHeaderTitle = () => {
	const frame = textFrame({
		render: 'div',
		display: 'block',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
		color: fontColor('titles-labels'),
		...font('h5'),
	});

	return constant('sidepanelHeaderTitleFrame', frame);
};

const targets: Target[] = [
	{ file: component('Sidepanel.tsx'), generate: generateSidepanel },
	{ file: component('SidepanelHeader.tsx'), generate: generateSidepanelHeader },
	{ file: component('SidepanelHeaderTitle.tsx'), generate: generateSidepanelHeaderTitle },
	{ file: component('SidepanelSection.tsx'), generate: generateSidepanelSection },
];

export default targets;
