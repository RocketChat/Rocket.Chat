import { join } from 'node:path';

import { elevation } from './lib/elevation.mts';
import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale, zIndex } from './lib/tokens.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Table', file);

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
		width: '100%',
		borderCollapse: 'collapse',
		borderSpacing: `0 ${offScale(2)}`,
	});

	const layouts = { auto: { tableLayout: 'auto' }, fixed: { tableLayout: 'fixed' } };

	const col = part('col', 'table-column', { width: 'var(--rcx-table-col-width, auto)' });

	return [
		`const tableWrapperFrame = ${literal(wrapper)} as const;`,
		`const tableFrame = ${literal(table)} as const;`,
		`const tableLayouts = ${literal(layouts)} as const;`,
		`const tableColumnFrame = ${literal(col)} as const;`,
	].join('\n\n');
};

const generateHead = () => `const tableHeadFrame = ${literal(part('thead', 'table-header-group'))} as const;`;
const generateBody = () => `const tableBodyFrame = ${literal(part('tbody', 'table-row-group'))} as const;`;
const generateFoot = () => `const tableFootFrame = ${literal(part('tfoot', 'table-footer-group'))} as const;`;

const generateRow = () => {
	const stripe = (value: string) => `var(--rcx-table-row-stripe, ${value})`;
	const tint = surfaceColors['surface-tint'].toString();
	const hover = surfaceColors['surface-hover'].toString();

	// The stripe is a custom property the stylesheet sets on even rows of a striped table: it outranks a plain row's hover
	// and not a selected action row's, which is what one fallback per paint reproduces
	const paints = {
		plain: { backgroundColor: stripe('transparent') },
		action: {
			backgroundColor: { default: stripe('transparent'), hover: stripe(hover), focus: stripe(hover) },
			cursor: { hover: 'pointer', focus: 'pointer' },
		},
		selected: { backgroundColor: stripe(tint) },
		selectedAction: {
			backgroundColor: { default: stripe(tint), hover, focus: hover },
			cursor: { hover: 'pointer', focus: 'pointer' },
		},
	};

	return [
		`const tableRowFrame = ${literal(part('tr', 'table-row'))} as const;`,
		`const tableRowPaints = ${literal(paints)} as const;`,
	].join('\n\n');
};

const generateCell = () => {
	const cell = part('td', 'table-cell', {
		position: 'static',
		padding: spacing('x8')!,
		userSelect: 'text',
		textAlign: 'unset',
		verticalAlign: 'middle',
	});

	const scales = { body: font('p2'), caption: font('c2'), strong: font('p2m') };

	const tones = {
		secondary: { color: textIconColor('font-secondary-info') },
		hint: { color: textIconColor('font-hint') },
		default: { color: textIconColor('font-default') },
	};

	// A header cell is relative to place its underline; in a sticky table it also sticks, over the rows that scroll under it
	const headers = {
		none: {},
		static: { position: 'relative' },
		sticky: { position: 'sticky', zIndex: zIndex.sticky, top: 0 },
	};

	const surfaces = { none: {}, light: { backgroundColor: surfaceColors['surface-light'].toString() } };
	const breaking = { true: { wordBreak: 'break-word' }, false: {} };
	const clickable = { true: { cursor: 'pointer' }, false: {} };
	const truncate = { true: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, false: {} };
	const aligns = {
		start: { textAlign: 'start' },
		end: { textAlign: 'end' },
		center: { textAlign: 'center' },
		justify: { textAlign: 'justify' },
	};

	const placeholder = part('hr', 'inline-block', {
		width: `${14 / 16}rem`,
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
	});

	return [
		`const tableCellFrame = ${literal({ ...textFrameDefaults(cell), ...cell })} as const;`,
		`const tableCellScales = ${literal(scales)} as const;`,
		`const tableCellTones = ${literal(tones)} as const;`,
		`const tableCellHeaders = ${literal(headers)} as const;`,
		`const tableCellSurfaces = ${literal(surfaces)} as const;`,
		`const tableCellBreaking = ${literal(breaking)} as const;`,
		`const tableCellClickable = ${literal(clickable)} as const;`,
		`const tableCellTruncate = ${literal(truncate)} as const;`,
		`const tableCellAligns = ${literal(aligns)} as const;`,
		`const tableCellPlaceholderFrame = ${literal(placeholder)} as const;`,
	].join('\n\n');
};

const generateSelection = () => {
	const radius = themed('table-selected-border-radius', borderRadius('medium'));
	const { '2': two } = elevation();

	const selection = {
		...part('div', 'flex', {
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingInline: spacing('x24')!,
			color: textIconColor('font-titles-labels'),
			borderRadius: radius,
			backgroundColor: surfaceColors['surface-neutral'].toString(),
			...(two as Record<string, Value>),
		}),
	};

	const text = {
		...part('div', 'block', {
			marginBlock: spacing('x16')!,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			...font('p2b'),
		}),
	};

	const actions = {
		...part('div', 'block', {
			flexShrink: 0,
			marginInline: spacing('-x8')!,
			...font('p2m'),
		}),
	};

	return [
		`const tableSelectionFrame = ${literal(selection)} as const;`,
		`const tableSelectionTextFrame = ${literal({ ...textFrameDefaults(text), ...text })} as const;`,
		`const tableSelectionActionsFrame = ${literal({ ...textFrameDefaults(actions), ...actions })} as const;`,
	].join('\n\n');
};

const generateStylesheet = () => {
	const line = `${borderWidth('default')} solid ${strokeColors['stroke-light'].toString()}`;

	return `@property --rcx-table-row-stripe {
	inherits: false;
	syntax: '*';
}

/* A custom property input the row frames read: it sets no property a frame owns */
.rcx-table--striped .rcx-table__row:nth-child(even) {
	--rcx-table-row-stripe: ${surfaceColors['surface-tint'].toString()};
}

/* A pseudo-element the header cell draws itself */
.rcx-table__cell--header::after {
	position: absolute;
	bottom: 0;
	inset-inline: 0;
	left: 0;
	right: 0;

	display: flex;

	content: '';
	border-block-end: ${line};
}`;
};

export default [
	{ file: component('Table.tsx'), generate: generateTable },
	{ file: component('TableHead.tsx'), generate: generateHead },
	{ file: component('TableBody.tsx'), generate: generateBody },
	{ file: component('TableFoot.tsx'), generate: generateFoot },
	{ file: component('TableRow.tsx'), generate: generateRow },
	{ file: component('TableCell.tsx'), generate: generateCell },
	{ file: component('TableSelection/TableSelection.tsx'), generate: generateSelection },
	{ file: component('Table.styles.css'), generate: generateStylesheet, css: true },
] satisfies Target[];
