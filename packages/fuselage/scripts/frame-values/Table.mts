import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, percent, radius, rem, size, space, themed, zIndex } from './lib/tokens.mts';
import { tokens } from '../../src/tamagui.tokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Table', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

// A table part restates what a plain element computes: a View is a column flex item that doesn't shrink
const part = (render: string, display: string, extra: Record<string, Value> = {}) => ({
	render,
	display,
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	...extra,
});

const generateTable = () => {
	const wrapper = part('div', 'block', { position: 'relative' });

	const table = part('table', 'table', {
		width: percent(100),
		borderCollapse: 'collapse',
		borderSpacing: `0 ${offScale(2)}px`,
	});

	const layouts = { auto: { tableLayout: 'auto' }, fixed: { tableLayout: 'fixed' } };

	// A column width on the size scale, which is `rem` on the web; any other width is the `col` attribute, in pixels
	const columnSizes = Object.fromEntries(
		(Object.keys(tokens.size) as (keyof typeof tokens.size)[]).map((name) => [name, { width: size(name) }]),
	);

	return [
		constant('tableWrapperFrame', wrapper),
		constant('tableFrame', table),
		constant('tableLayouts', layouts),
		constant('tableColumnFrame', part('col', 'table-column')),
		constant('tableColumnSizes', columnSizes),
	].join('\n\n');
};

const generateHead = () => constant('tableHeadFrame', part('thead', 'table-header-group'));
const generateBody = () => constant('tableBodyFrame', part('tbody', 'table-row-group'));
const generateFoot = () => constant('tableFootFrame', part('tfoot', 'table-footer-group'));

const generateRow = () => {
	const hover = themed('surface-hover');
	const tint = themed('surface-tint');
	const pointer = { hover: 'pointer', focus: 'pointer' };
	const noOutline = { focus: 'none' };

	// The even rows of a striped table are painted by the stylesheet, which can count children
	const paints = {
		plain: {},
		action: { backgroundColor: { hover, focus: hover }, cursor: pointer, outlineStyle: noOutline },
		selected: { backgroundColor: tint },
		selectedAction: { backgroundColor: { default: tint, hover, focus: hover }, cursor: pointer, outlineStyle: noOutline },
	};

	return [constant('tableRowFrame', part('tr', 'table-row')), constant('tableRowPaints', paints)].join('\n\n');
};

const generateCell = () => {
	const cell = part('td', 'table-cell', {
		position: 'static',
		padding: space('x8'),
		userSelect: 'text',
		textAlign: 'unset',
		verticalAlign: 'middle',
		...fontScale('p2'),
	});

	const tones = {
		secondary: { color: themed('font-secondary-info') },
		hint: { color: themed('font-hint') },
		default: { color: themed('font-default') },
	};

	// A strong or row-header cell outranks a header cell, which outranks the body text
	const scales = { body: {}, header: fontScale('c2'), strong: fontScale('p2m') };

	// A header cell is relative to place its underline; in a sticky table it also sticks, over the rows that scroll under it
	const headers = {
		none: {},
		static: { position: 'relative' },
		sticky: { position: 'sticky', zIndex: zIndex('sticky'), top: 0 },
	};

	const surfaces = { none: {}, light: { backgroundColor: themed('surface-light') } };
	const breaking = { true: { wordBreak: 'break-word' }, false: {} };
	const clickable = { true: { cursor: 'pointer', outlineStyle: 'none' }, false: {} };
	const truncate = { true: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, false: {} };
	const aligns = {
		start: { textAlign: 'start' },
		end: { textAlign: 'end' },
		center: { textAlign: 'center' },
		justify: { textAlign: 'justify' },
	};

	const placeholder = part('hr', 'inline-block', {
		width: rem(14),
		borderWidth: offScale(1),
		borderStyle: 'solid',
	});

	return [
		constant('tableCellFrame', { ...textFrameDefaults(cell), ...cell }),
		constant('tableCellTones', tones),
		constant('tableCellScales', scales),
		constant('tableCellHeaders', headers),
		constant('tableCellSurfaces', surfaces),
		constant('tableCellBreaking', breaking),
		constant('tableCellClickable', clickable),
		constant('tableCellTruncate', truncate),
		constant('tableCellAligns', aligns),
		constant('tableCellPlaceholderFrame', placeholder),
	].join('\n\n');
};

const generateSelection = () => {
	const selection = part('div', 'flex', {
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingInline: space('x24'),
		color: themed('font-titles-labels'),
		borderRadius: radius('medium'),
		backgroundColor: themed('surface-neutral'),
		boxShadow: `0 0 2px 0 ${themed('shadow-elevation-2x')}, 0 0 12px 0 ${themed('shadow-elevation-2y')}`,
		borderWidth: offScale(1),
		borderStyle: 'solid',
		borderColor: themed('shadow-elevation-border'),
	});

	const text = part('div', 'block', {
		marginBlock: space('x16'),
		...fontScale('p2b'),
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	});

	const actions = part('div', 'block', {
		flexShrink: 0,
		marginInline: offScale(-8),
		...fontScale('p2m'),
	});

	return [
		constant('tableSelectionFrame', selection),
		constant('tableSelectionTextFrame', { ...textFrameDefaults(text), ...text }),
		constant('tableSelectionActionsFrame', { ...textFrameDefaults(actions), ...actions }),
	].join('\n\n');
};

export default [
	{ file: component('Table.tsx'), generate: generateTable },
	{ file: component('TableHead.tsx'), generate: generateHead },
	{ file: component('TableBody.tsx'), generate: generateBody },
	{ file: component('TableFoot.tsx'), generate: generateFoot },
	{ file: component('TableRow.tsx'), generate: generateRow },
	{ file: component('TableCell.tsx'), generate: generateCell },
	{ file: component('TableSelection/TableSelection.tsx'), generate: generateSelection },
] satisfies Target[];
