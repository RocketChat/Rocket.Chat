import { join } from 'node:path';

import { font, textIconColor } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderWidth, size, spacing } from '../../src/styleTokens.ts';

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
		borderBottomWidth: borderWidth('default'),
		borderBottomColor: strokeColors['stroke-extra-light'].toString(),
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

	const underline = borderWidth('default');
	const rule = strokeColors['stroke-extra-light'].toString();
	const focus = strokeColors['stroke-highlight'].toString();
	const ring = `0 0 0 ${borderWidth('medium')} ${strokeColors['stroke-extra-light-highlight'].toString()}`;

	const bar = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: size('x88')!,
		paddingBlock: `calc(${spacing('x32')} - ${underline})`,
		paddingInline: `calc(${spacing('x8')} - ${underline})`,
		textAlign: 'start',
		color: textIconColor('font-titles-labels'),
		borderTopWidth: underline,
		borderRightWidth: underline,
		borderBottomWidth: underline,
		borderLeftWidth: underline,
		borderTopColor: rule,
		borderRightColor: 'transparent',
		borderBottomColor: 'transparent',
		borderLeftColor: 'transparent',
	};

	// What the bar does depends on whether it is a tab stop: only a collapsible, enabled section is one
	const states = {
		plain: {},
		interactive: {
			cursor: 'pointer',
			outlineStyle: 'none',
			backgroundColor: { hover: surfaceColors['surface-tint'].toString() },
			boxShadow: { focus: ring },
			borderTopColor: { default: rule, focus },
			borderRightColor: { default: 'transparent', focus },
			borderBottomColor: { default: 'transparent', focus },
			borderLeftColor: { default: 'transparent', focus },
		},
		disabled: {
			cursor: 'not-allowed',
			color: textIconColor('font-disabled'),
			backgroundColor: surfaceColors['surface-disabled'].toString(),
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
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		...font('h4'),
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
		paddingInline: spacing('x8')!,
	};

	const panelStates = {
		expanded: { visibility: 'visible', height: 'auto', paddingBlock: spacing('x32')! },
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
