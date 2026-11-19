import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, rem, space, themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Accordion', file);

const generateAccordion = () => {
	const frame = {
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		borderBottomWidth: offScale(1),
		borderBottomColor: themed('stroke-extra-light'),
	};

	return `const accordionFrame = ${literal(frame)} as const;`;
};

const generateItem = () => {
	const section = {
		render: 'section',
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
	};

	const underline = offScale(1);
	const rule = themed('stroke-extra-light');
	const focus = themed('stroke-highlight');

	// The bar keeps the border its focus ring needs, so its padding is the section's less that border
	const bar = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: rem(88),
		paddingBlock: offScale(31),
		paddingInline: offScale(7),
		textAlign: 'start',
		color: themed('font-titles-labels'),
		borderTopWidth: underline,
		borderRightWidth: underline,
		borderBottomWidth: underline,
		borderLeftWidth: underline,
		borderTopColor: rule,
		borderRightColor: 'transparent',
		borderBottomColor: 'transparent',
		borderLeftColor: 'transparent',
	};

	// Only a collapsible, enabled section is a tab stop and reacts to the pointer. The ring shows on any focus: a click
	// hands the focus back at once
	const states = {
		plain: {},
		interactive: {
			cursor: 'pointer',
			outlineStyle: 'none',
			backgroundColor: { hover: themed('surface-tint') },
			boxShadow: { focus: `0 0 0 2px ${themed('stroke-extra-light-highlight')}` },
			borderTopColor: { default: rule, focus },
			borderRightColor: { default: 'transparent', focus },
			borderBottomColor: { default: 'transparent', focus },
			borderLeftColor: { default: 'transparent', focus },
		},
		disabled: {
			cursor: 'not-allowed',
			color: themed('font-disabled'),
			backgroundColor: themed('surface-disabled'),
		},
	};

	const titleFrame = {
		render: 'h2',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 'auto',
		minHeight: 'auto',
		...fontScale('h4'),
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	};

	const panel = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		visibility: 'hidden',
		overflow: 'hidden',
		height: 0,
		paddingBlock: 0,
		paddingInline: space('x8'),
	};

	const panelStates = {
		expanded: { visibility: 'visible', height: 'auto', paddingBlock: space('x32') },
		collapsed: {},
	};

	return [
		`const accordionItemFrame = ${literal(section)} as const;`,
		`const accordionBarFrame = ${literal(bar)} as const;`,
		`const accordionBarStates = ${literal(states)} as const;`,
		`const accordionTitleFrame = ${literal({ ...textFrameDefaults(titleFrame), ...titleFrame })} as const;`,
		`const accordionPanelFrame = ${literal({ ...textFrameDefaults(panel), ...panel })} as const;`,
		`const accordionPanelStates = ${literal(panelStates)} as const;`,
	].join('\n\n');
};

export default [
	{ file: component('Accordion.tsx'), generate: generateAccordion },
	{ file: component('AccordionItem.tsx'), generate: generateItem },
] satisfies Target[];
