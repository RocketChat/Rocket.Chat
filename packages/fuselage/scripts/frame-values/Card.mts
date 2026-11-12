import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components', file);

// What a plain element computes, restated: a View is a column flex item that doesn't shrink
const plain = (render: string, display: string, extra: Record<string, Value> = {}) => ({
	render,
	display,
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	...extra,
});

// A part that holds arbitrary children, strings included, is a Text frame that restates the View's defaults
const text = (frame: Record<string, Value>) => literal({ ...textFrameDefaults(frame), ...frame });

const gap = () => spacing('x8')!;

const generateCard = () => {
	const background = themed('card-background-color', surfaceColors['surface-light'].toString());
	const hover = surfaceColors['surface-hover'].toString();

	const card = plain('div', 'flex', {
		color: themed('card-color', textIconColor('font-default')),
		borderRadius: borderRadius('large'),
		backgroundColor: background,
	});

	const vertical = { flexDirection: 'column', rowGap: spacing('x24')!, columnGap: spacing('x24')! };
	const horizontal = {
		flexDirection: 'row',
		flexWrap: { default: 'wrap', sm: 'nowrap' },
		alignItems: 'center',
		rowGap: spacing('x16')!,
		columnGap: spacing('x16')!,
	};

	// The hero padding comes after the layout's in the stylesheet, and the compiler can't resolve two conditionals that both
	// contribute a flex property, so each layout, hero and grow combination is one value
	const layouts: Record<string, Value> = {};
	for (const [name, base, padding] of [
		['vertical', vertical, spacing('x20')!],
		['horizontal', horizontal, spacing('x12')!],
	] as const) {
		layouts[name] = { ...base, padding };
		layouts[`${name}-hero`] = { ...base, padding: offScale(28) };
		layouts[`${name}-grow`] = { ...base, padding, flexGrow: 1 };
		layouts[`${name}-hero-grow`] = { ...base, padding: offScale(28), flexGrow: 1 };
	}

	const clickables = {
		true: {
			backgroundColor: { default: background, hover, focus: hover },
			cursor: { hover: 'pointer', focus: 'pointer' },
		},
		false: {},
	};

	return [
		`const cardFrame = ${text(card)} as const;`,
		`const cardLayouts = ${literal(layouts)} as const;`,
		`const cardClickables = ${literal(clickables)} as const;`,
	].join('\n\n');
};

const row = (render: string, extra: Record<string, Value> = {}) =>
	plain(render, 'flex', { alignItems: 'center', rowGap: gap(), columnGap: gap(), ...extra });

const generateHeader = () => `const cardHeaderFrame = ${text(row('div'))} as const;`;
const generateControls = () => `const cardControlsFrame = ${text(row('div'))} as const;`;
const generateRow = () => `const cardRowFrame = ${text(row('div', { flexGrow: 1 }))} as const;`;

const generateCol = () => {
	const col = plain('div', 'flex', { flexDirection: 'column', rowGap: gap(), columnGap: gap() });

	// A column's rows sit closer in a horizontal card
	const layouts = { vertical: {}, horizontal: { rowGap: spacing('x4')! } };

	return [`const cardColFrame = ${text(col)} as const;`, `const cardColLayouts = ${literal(layouts)} as const;`].join('\n\n');
};

const generateTitle = () => {
	const frame = row('h4');

	return [
		`const cardTitleFrame = ${text(frame)} as const;`,
		`const cardTitleVariants = ${literal({
			h3: font('h3'),
			h4: font('h4'),
			h5: font('h5'),
		})} as const;`,
	].join('\n\n');
};

const generateBody = () => {
	const frame = plain('div', 'flex', { flexGrow: 1, rowGap: gap(), columnGap: gap(), ...font('p2m') });

	const directions = { row: {}, column: { flexDirection: 'column' } };
	const heights = { auto: {}, full: { height: '100%' } };

	return [
		`const cardBodyFrame = ${text(frame)} as const;`,
		`const cardBodyDirections = ${literal(directions)} as const;`,
		`const cardBodyHeights = ${literal(heights)} as const;`,
	].join('\n\n');
};

const generateGroup = () => {
	const group = plain('div', 'flex', { flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'center' });

	// A wrapping group keeps the 8px at its outer edges that the items' margins gave it
	const flows = {
		row: { columnGap: spacing('x16')!, rowGap: 0 },
		wrap: { flexWrap: 'wrap', columnGap: spacing('x16')!, rowGap: spacing('x16')!, paddingInline: spacing('x8')! },
		vertical: { flexDirection: 'column', columnGap: 0, rowGap: spacing('x8')! },
		verticalWrap: { flexDirection: 'column', flexWrap: 'wrap', columnGap: 0, rowGap: spacing('x8')! },
	};

	const aligns = {
		start: { justifyContent: 'flex-start' },
		center: { justifyContent: 'center' },
		end: { justifyContent: 'flex-end' },
	};

	const stretches = { true: { alignItems: 'stretch' }, false: {} };

	return [
		`const cardGroupFrame = ${text(group)} as const;`,
		`const cardGroupFlows = ${literal(flows)} as const;`,
		`const cardGroupAligns = ${literal(aligns)} as const;`,
		`const cardGroupStretches = ${literal(stretches)} as const;`,
	].join('\n\n');
};

export default [
	{ file: component('Card/Card.tsx'), generate: generateCard },
	{ file: component('Card/CardHeader.tsx'), generate: generateHeader },
	{ file: component('Card/CardControls.tsx'), generate: generateControls },
	{ file: component('Card/CardRow.tsx'), generate: generateRow },
	{ file: component('Card/CardCol.tsx'), generate: generateCol },
	{ file: component('Card/CardTitle.tsx'), generate: generateTitle },
	{ file: component('Card/CardBody.tsx'), generate: generateBody },
	{ file: component('CardGroup/CardGroup.tsx'), generate: generateGroup },
] satisfies Target[];
