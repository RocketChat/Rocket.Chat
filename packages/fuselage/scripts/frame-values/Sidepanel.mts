import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, percent, size, space, themed } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidepanel', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

// A header and a section hold the consumer's text as well as its elements, so their frames are Text
const textFrame = (style: Record<string, Value>) => {
	const frame = webDefaults(style);
	return { ...textFrameDefaults(frame), ...frame };
};

const bar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: space('x8') };

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
			height: percent(100),
			color: themed('font-default'),
			borderBlockWidth: 0,
			borderInlineWidth: 1,
			borderStyle: 'solid',
			borderColor: themed('stroke-light'),
			backgroundColor: themed('surface-sidebar'),
		}),
	);

// The negative margin pulls the flush divider that follows up into the header
const generateHeader = () =>
	constant(
		'headerFrame',
		textFrame({ render: 'div', ...bar, height: size('x44'), marginBlockEnd: offScale(-2), paddingInline: space('x12') }),
	);

const generateHeaderTitle = () =>
	constant(
		'titleFrame',
		textFrame({
			render: 'div',
			display: 'block',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
			textOverflow: 'ellipsis',
			color: themed('font-titles-labels'),
			...fontScale('h5'),
		}),
	);

const generateSection = () => constant('sectionFrame', textFrame({ render: 'div', ...bar, padding: space('x16') }));

export default [
	{ file: component('Sidepanel.tsx'), generate: generateSidepanel },
	{ file: component('SidepanelHeader.tsx'), generate: generateHeader },
	{ file: component('SidepanelHeaderTitle.tsx'), generate: generateHeaderTitle },
	{ file: component('SidepanelSection.tsx'), generate: generateSection },
] satisfies Target[];
