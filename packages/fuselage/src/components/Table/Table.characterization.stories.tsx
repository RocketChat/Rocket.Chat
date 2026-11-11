import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import Table from './Table';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableFoot from './TableFoot';
import TableHead from './TableHead';
import TableRow from './TableRow';
import { TableSelection, TableSelectionButton, TableSelectionButtonGroup } from './TableSelection';
import { ariaSnapshot, classContract, computed, expectForwards, forcePseudo, isJsdom } from '../../testing/g0';

// G0 characterization of the Table family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Table',
	component: Table,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>;

type Story = StoryObj<typeof Table>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const refs = {
	table: createRef<HTMLTableElement>(),
	head: createRef<HTMLTableSectionElement>(),
	body: createRef<HTMLTableSectionElement>(),
	foot: createRef<HTMLTableSectionElement>(),
	row: createRef<HTMLTableRowElement>(),
	headCell: createRef<HTMLTableCellElement>(),
	cell: createRef<HTMLTableCellElement>(),
};

const handlersOf = () => ({ onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onKeyDown: fn() });
const rowHandlers = handlersOf();
const cellHandlers = handlersOf();

export const Forwarding: Story = {
	render: () => (
		<Table ref={refs.table} {...forwarded('table')}>
			<TableHead ref={refs.head} {...forwarded('head')}>
				<TableRow>
					<TableCell ref={refs.headCell} {...forwarded('head-cell')}>
						Name
					</TableCell>
				</TableRow>
			</TableHead>
			<TableBody ref={refs.body} {...forwarded('body')}>
				<TableRow ref={refs.row} {...forwarded('row')} {...rowHandlers}>
					<TableCell ref={refs.cell} {...forwarded('cell')} {...cellHandlers}>
						Value
					</TableCell>
				</TableRow>
			</TableBody>
			<TableFoot ref={refs.foot} {...forwarded('foot')}>
				<TableRow>
					<TableCell>Total</TableCell>
				</TableRow>
			</TableFoot>
		</Table>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'table', { ...forwarded('table'), ref: refs.table });
		await expectForwards(canvasElement, 'thead', { ...forwarded('head'), ref: refs.head });
		await expectForwards(canvasElement, 'tbody', { ...forwarded('body'), ref: refs.body });
		await expectForwards(canvasElement, 'tfoot', { ...forwarded('foot'), ref: refs.foot });
		await expectForwards(canvasElement, 'tbody tr', { ...forwarded('row'), ref: refs.row, handlers: rowHandlers });
		await expectForwards(canvasElement, 'th', { ...forwarded('head-cell'), ref: refs.headCell });
		await expectForwards(canvasElement, 'tbody td', { ...forwarded('cell'), ref: refs.cell, handlers: cellHandlers });
		// Only the table takes the props: its wrapper does not
		await expect(canvasElement.querySelector('.rcx-table__wrapper')).not.toHaveAttribute('id');
		await expect(canvasElement.querySelector('.rcx-table__wrapper > table')).toBe(canvasElement.querySelector('table'));
	},
};

export const CellAttributes: Story = {
	render: () => (
		<Table>
			<TableBody>
				<TableRow>
					<TableCell colSpan={2} rowSpan={2} headers='a b' scope='col' tabIndex={0} role='gridcell'>
						Spans
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
	play: async ({ canvasElement }) => {
		const cell = canvasElement.querySelector('td') as HTMLElement;
		await expect(cell).toHaveAttribute('colspan', '2');
		await expect(cell).toHaveAttribute('rowspan', '2');
		await expect(cell).toHaveAttribute('headers', 'a b');
		await expect(cell).toHaveAttribute('scope', 'col');
		await expect(cell).toHaveAttribute('tabindex', '0');
		await expect(cell).toHaveAttribute('role', 'gridcell');
	},
};

export const CellTags: Story = {
	render: () => (
		<Table>
			<TableHead>
				<TableRow>
					<TableCell data-cell='head'>Head</TableCell>
					<TableCell data-cell='head-td' is='td'>
						Head as td
					</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
					<TableCell data-cell='body'>Body</TableCell>
					<TableCell data-cell='row-header' rowHeader>
						Row header
					</TableCell>
					<TableCell data-cell='body-th' is='th'>
						Body as th
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
	play: async ({ canvasElement }) => {
		const cell = (name: string) => canvasElement.querySelector(`[data-cell="${name}"]`) as HTMLElement;
		await expect(cell('head').tagName).toBe('TH');
		await expect(cell('head')).not.toHaveAttribute('scope');
		await expect(cell('body').tagName).toBe('TD');
		await expect(cell('row-header').tagName).toBe('TH');
		await expect(cell('row-header')).toHaveAttribute('scope', 'row');
		// A consumer `is` wins over the tag the cell picks
		await expect(cell('head-td').tagName).toBe('TD');
		await expect(cell('body-th').tagName).toBe('TH');
	},
};

export const Placeholder: Story = {
	render: () => (
		<Table>
			<TableHead>
				<TableRow>
					<TableCell data-cell='head' />
				</TableRow>
			</TableHead>
			<TableBody>
				<TableRow>
					<TableCell data-cell='empty' />
					<TableCell data-cell='zero'>{0}</TableCell>
					<TableCell data-cell='text'>Text</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
	play: async ({ canvasElement }) => {
		const cell = (name: string) => canvasElement.querySelector(`[data-cell="${name}"]`) as HTMLElement;
		await expect(cell('empty').querySelector('hr.rcx-table__cell-placeholder')).not.toBeNull();
		await expect(cell('head').children).toHaveLength(0);
		await expect(cell('zero')).toHaveTextContent('0');
		await expect(cell('zero').querySelector('hr')).toBeNull();
		await expect(cell('text').querySelector('hr')).toBeNull();
	},
};

export const Columns: Story = {
	render: () => (
		<Table columns={['x100', '30%', 120, 'auto']} fixed>
			<TableBody>
				<TableRow>
					<TableCell>A</TableCell>
					<TableCell>B</TableCell>
					<TableCell>C</TableCell>
					<TableCell>D</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelectorAll('table > colgroup > col')).toHaveLength(4);
		await expect(canvasElement.querySelector('table > colgroup')?.nextElementSibling?.tagName).toBe('TBODY');
		if (isJsdom()) return;
		const table = canvasElement.querySelector('table') as HTMLElement;
		const [a, b, c, d] = [...canvasElement.querySelectorAll('td')].map((cell) => cell.getBoundingClientRect().width);
		await expect(a).toBe(100);
		await expect(b).toBeCloseTo(table.getBoundingClientRect().width * 0.3, 0);
		await expect(c).toBe(120);
		await expect(d).toBeGreaterThan(0);
	},
};

export const WithoutColumns: Story = {
	render: () => (
		<Table>
			<TableBody>
				<TableRow>
					<TableCell>A</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('colgroup')).toBeNull();
	},
};

const sample = (props: Record<string, unknown> = {}) => (
	<Table aria-label='Users' {...props}>
		<TableHead>
			<TableRow>
				<TableCell>Name</TableCell>
				<TableCell align='end'>Count</TableCell>
			</TableRow>
		</TableHead>
		<TableBody>
			<TableRow>
				<TableCell rowHeader>Alice</TableCell>
				<TableCell align='end'>1</TableCell>
			</TableRow>
			<TableRow action selected>
				<TableCell>Bob</TableCell>
				<TableCell clickable truncate strong color='hint'>
					2
				</TableCell>
			</TableRow>
			<TableRow>
				<TableCell align='center' color='default'>
					Carol
				</TableCell>
				<TableCell align='justify'>3</TableCell>
			</TableRow>
		</TableBody>
		<TableFoot>
			<TableRow>
				<TableCell>Total</TableCell>
				<TableCell />
			</TableRow>
		</TableFoot>
	</Table>
);

const everyVariation = (
	<>
		{sample()}
		{sample({ striped: true, sticky: true, fixed: true })}
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- table "Users":',
				'  - row "Name Count":',
				'    - columnheader "Name"',
				'    - columnheader "Count"',
				'  - row "Alice 1":',
				'    - columnheader "Alice"',
				'    - cell "1"',
				'  - row "Bob 2":',
				'    - cell "Bob"',
				'    - cell "2"',
				'  - row "Carol 3":',
				'    - cell "Carol"',
				'    - cell "3"',
				'  - row "Total":',
				'    - cell "Total"',
				'    - cell',
				'- table "Users":',
				'  - row "Name Count":',
				'    - columnheader "Name"',
				'    - columnheader "Count"',
				'  - row "Alice 1":',
				'    - columnheader "Alice"',
				'    - cell "1"',
				'  - row "Bob 2":',
				'    - cell "Bob"',
				'    - cell "2"',
				'  - row "Carol 3":',
				'    - cell "Carol"',
				'    - cell "3"',
				'  - row "Total":',
				'    - cell "Total"',
				'    - cell',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-table__wrapper',
				'root > div[0] > table: rcx-box rcx-box--full rcx-table',
				'root > div[0] > table > thead: rcx-box rcx-box--full rcx-table__head',
				'root > div[0] > table > thead > tr: rcx-box rcx-box--full rcx-table__row',
				'root > div[0] > table > thead > tr > th[0]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--header',
				'root > div[0] > table > thead > tr > th[1]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-end rcx-table__cell--header',
				'root > div[0] > table > tbody: rcx-box rcx-box--full rcx-table__body',
				'root > div[0] > table > tbody > tr[0]: rcx-box rcx-box--full rcx-table__row',
				'root > div[0] > table > tbody > tr[0] > th: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--row-header',
				'root > div[0] > table > tbody > tr[0] > td: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-end',
				'root > div[0] > table > tbody > tr[1]: rcx-box rcx-box--full rcx-table__row rcx-table__row--action rcx-table__row--selected',
				'root > div[0] > table > tbody > tr[1] > td[0]: rcx-box rcx-box--full rcx-table__cell',
				'root > div[0] > table > tbody > tr[1] > td[1]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--clickable rcx-table__cell--color-hint rcx-table__cell--strong rcx-table__cell--truncate',
				'root > div[0] > table > tbody > tr[2]: rcx-box rcx-box--full rcx-table__row',
				'root > div[0] > table > tbody > tr[2] > td[0]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-center rcx-table__cell--color-default',
				'root > div[0] > table > tbody > tr[2] > td[1]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-justify',
				'root > div[0] > table > tfoot: rcx-box rcx-box--full rcx-table__foot',
				'root > div[0] > table > tfoot > tr: rcx-box rcx-box--full rcx-table__row',
				'root > div[0] > table > tfoot > tr > td[0]: rcx-box rcx-box--full rcx-table__cell',
				'root > div[0] > table > tfoot > tr > td[1]: rcx-box rcx-box--full rcx-table__cell',
				'root > div[0] > table > tfoot > tr > td[1] > hr: rcx-box rcx-box--full rcx-table__cell-placeholder',
				'root > div[1]: rcx-box rcx-box--full rcx-table__wrapper',
				'root > div[1] > table: rcx-box rcx-box--full rcx-table rcx-table--fixed rcx-table--sticky rcx-table--striped',
				'root > div[1] > table > thead: rcx-box rcx-box--full rcx-table__head',
				'root > div[1] > table > thead > tr: rcx-box rcx-box--full rcx-table__row',
				'root > div[1] > table > thead > tr > th[0]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--header',
				'root > div[1] > table > thead > tr > th[1]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-end rcx-table__cell--header',
				'root > div[1] > table > tbody: rcx-box rcx-box--full rcx-table__body',
				'root > div[1] > table > tbody > tr[0]: rcx-box rcx-box--full rcx-table__row',
				'root > div[1] > table > tbody > tr[0] > th: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--row-header',
				'root > div[1] > table > tbody > tr[0] > td: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-end',
				'root > div[1] > table > tbody > tr[1]: rcx-box rcx-box--full rcx-table__row rcx-table__row--action rcx-table__row--selected',
				'root > div[1] > table > tbody > tr[1] > td[0]: rcx-box rcx-box--full rcx-table__cell',
				'root > div[1] > table > tbody > tr[1] > td[1]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--clickable rcx-table__cell--color-hint rcx-table__cell--strong rcx-table__cell--truncate',
				'root > div[1] > table > tbody > tr[2]: rcx-box rcx-box--full rcx-table__row',
				'root > div[1] > table > tbody > tr[2] > td[0]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-center rcx-table__cell--color-default',
				'root > div[1] > table > tbody > tr[2] > td[1]: rcx-box rcx-box--full rcx-table__cell rcx-table__cell--align-justify',
				'root > div[1] > table > tfoot: rcx-box rcx-box--full rcx-table__foot',
				'root > div[1] > table > tfoot > tr: rcx-box rcx-box--full rcx-table__row',
				'root > div[1] > table > tfoot > tr > td[0]: rcx-box rcx-box--full rcx-table__cell',
				'root > div[1] > table > tfoot > tr > td[1]: rcx-box rcx-box--full rcx-table__cell',
				'root > div[1] > table > tfoot > tr > td[1] > hr: rcx-box rcx-box--full rcx-table__cell-placeholder',
			].join('\n'),
		);
	},
};

export const RolesByName: Story = {
	render: () => sample(),
	play: async ({ canvasElement }) => {
		// End-to-end tests find the table, its rows and its cells by role and name
		const table = canvasElement.querySelector('table') as HTMLElement;
		await expect(table).toHaveAttribute('aria-label', 'Users');
		await expect(table.querySelectorAll('thead th')).toHaveLength(2);
		await expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
		await expect(table.querySelector('tbody th[scope="row"]')).toHaveTextContent('Alice');
		await expect(table.querySelectorAll('tbody td')).toHaveLength(5);
	},
};

export const TableLayout: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<div id='auto'>{sample()}</div>
			<div id='fixed'>{sample({ fixed: true })}</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const el = (selector: string) => canvasElement.querySelector(selector) as HTMLElement;
		await expect(computed(el('#auto table'), 'display')).toBe('table');
		await expect(computed(el('#auto table'), 'table-layout')).toBe('auto');
		await expect(computed(el('#fixed table'), 'table-layout')).toBe('fixed');
		await expect(computed(el('#auto table'), 'border-collapse')).toBe('collapse');
		await expect(el('#auto table').getBoundingClientRect().width).toBe(400);
		await expect(computed(el('#auto thead'), 'display')).toBe('table-header-group');
		await expect(computed(el('#auto tbody'), 'display')).toBe('table-row-group');
		await expect(computed(el('#auto tfoot'), 'display')).toBe('table-footer-group');
		await expect(computed(el('#auto tbody tr'), 'display')).toBe('table-row');
		await expect(computed(el('#auto tbody td'), 'display')).toBe('table-cell');
		await expect(computed(el('#auto tbody td'), 'padding-top')).toBe('8px');
		await expect(computed(el('#auto tbody td'), 'vertical-align')).toBe('middle');
		await expect(computed(el('#auto .rcx-table__wrapper'), 'position')).toBe('relative');
	},
};

export const CellStyles: Story = {
	render: () => (
		<div style={{ width: 200 }}>
			<Table fixed>
				<TableHead>
					<TableRow>
						<TableCell id='head'>Head</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					<TableRow>
						<TableCell id='plain'>Plain text that is long enough to overflow the narrow column</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='truncate' truncate>
							Truncated text that is long enough to overflow the narrow column
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='strong' strong>
							Strong
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='default' color='default'>
							Default
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='hint' color='hint'>
							Hint
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='clickable' clickable>
							Clickable
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='row-header' rowHeader>
							Row header
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell id='start' align='start'>
							Start
						</TableCell>
						<TableCell id='center' align='center'>
							Center
						</TableCell>
						<TableCell id='end' align='end'>
							End
						</TableCell>
						<TableCell id='justify' align='justify'>
							Justify
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;

		await expect(computed(el('truncate'), 'text-overflow')).toBe('ellipsis');
		await expect(computed(el('truncate'), 'white-space')).toBe('nowrap');
		await expect(computed(el('truncate'), 'overflow')).toBe('hidden');
		await expect(computed(el('plain'), 'text-overflow')).not.toBe('ellipsis');

		await expect(Number(computed(el('strong'), 'font-weight'))).toBeGreaterThan(Number(computed(el('plain'), 'font-weight')));
		await expect(computed(el('default'), 'color')).not.toBe(computed(el('plain'), 'color'));
		await expect(computed(el('hint'), 'color')).toBe(computed(el('row-header'), 'color'));
		await expect(computed(el('clickable'), 'cursor')).toBe('pointer');
		await expect(computed(el('plain'), 'cursor')).not.toBe('pointer');
		await expect(computed(el('plain'), 'user-select')).toBe('text');

		// The header is set in the caption scale, the row header in the heavier body scale
		await expect(parseFloat(computed(el('head'), 'font-size'))).toBeLessThan(parseFloat(computed(el('plain'), 'font-size')));
		await expect(Number(computed(el('row-header'), 'font-weight'))).toBeGreaterThan(Number(computed(el('plain'), 'font-weight')));
		await expect(computed(el('row-header'), 'background-color')).not.toBe(computed(el('plain'), 'background-color'));

		await expect(computed(el('start'), 'text-align')).toBe('start');
		await expect(computed(el('center'), 'text-align')).toBe('center');
		await expect(computed(el('end'), 'text-align')).toBe('end');
		await expect(computed(el('justify'), 'text-align')).toBe('justify');
	},
};

export const HeaderUnderline: Story = {
	render: () => sample(),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const header = canvasElement.querySelector('thead th') as HTMLElement;
		const body = canvasElement.querySelector('tbody td') as HTMLElement;
		const line = getComputedStyle(header, '::after');
		await expect(line.content).toBe('""');
		await expect(line.position).toBe('absolute');
		await expect(line.borderBottomWidth).toBe('1px');
		await expect(computed(header, 'position')).toBe('relative');
		await expect(getComputedStyle(body, '::after').content).not.toBe('""');
	},
};

const manyRows = (props: Record<string, unknown>) => (
	<div id='scroller' style={{ height: 150, overflow: 'auto' }}>
		<Table {...props}>
			<TableHead>
				<TableRow>
					<TableCell id='header'>Header</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{Array.from({ length: 30 }, (_, index) => (
					<TableRow key={index}>
						<TableCell>Row {index}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</div>
);

export const StickyHeader: Story = {
	render: () => (
		<>
			<div id='sticky'>{manyRows({ sticky: true })}</div>
			<div id='loose'>{manyRows({})}</div>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const header = (id: string) => canvasElement.querySelector(`#${id} #header`) as HTMLElement;
		const scroller = (id: string) => canvasElement.querySelector(`#${id} #scroller`) as HTMLElement;

		await expect(computed(header('sticky'), 'position')).toBe('sticky');
		await expect(computed(header('sticky'), 'top')).toBe('0px');
		await expect(computed(header('sticky'), 'z-index')).toBe('10');
		// The sticky header paints its own background, so the rows scrolling under it do not show through
		await expect(computed(header('sticky'), 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
		await expect(computed(header('loose'), 'position')).toBe('relative');

		scroller('sticky').scrollTop = 120;
		scroller('loose').scrollTop = 120;
		await expect(header('sticky').getBoundingClientRect().top).toBe(scroller('sticky').getBoundingClientRect().top);
		await expect(header('loose').getBoundingClientRect().top).toBeLessThan(scroller('loose').getBoundingClientRect().top);
	},
};

const rowStates = (props: Record<string, unknown>) => (
	<Table {...props}>
		<TableBody>
			<TableRow id='odd'>
				<TableCell>1</TableCell>
			</TableRow>
			<TableRow id='even'>
				<TableCell>2</TableCell>
			</TableRow>
			<TableRow id='odd-action' action>
				<TableCell>3</TableCell>
			</TableRow>
			<TableRow id='even-action' action>
				<TableCell>4</TableCell>
			</TableRow>
			<TableRow id='odd-selected' selected>
				<TableCell>5</TableCell>
			</TableRow>
			<TableRow id='even-selected-action' selected action>
				<TableCell>6</TableCell>
			</TableRow>
			<TableRow id='odd-selected-action' selected action>
				<TableCell>7</TableCell>
			</TableRow>
		</TableBody>
	</Table>
);

const NONE = 'rgba(0, 0, 0, 0)';

export const RowStates: Story = {
	render: () => (
		<>
			<div id='flat'>{rowStates({})}</div>
			<div id='striped'>{rowStates({ striped: true })}</div>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const row = (table: string, id: string) => canvasElement.querySelector(`#${table} #${id}`) as HTMLElement;
		const bg = (table: string, id: string) => computed(row(table, id), 'background-color');
		const hover = (table: string, id: string) => {
			forcePseudo(row(table, id), 'hover');
			return bg(table, id);
		};

		// Plain rows have no paint, a selected one is tinted, and a hovered action row takes the hover colour
		const tint = bg('flat', 'odd-selected');
		await expect(bg('flat', 'odd')).toBe(NONE);
		await expect(bg('flat', 'odd-action')).toBe(NONE);
		await expect(tint).not.toBe(NONE);
		const hovered = hover('flat', 'odd-action');
		await expect(hovered).not.toBe(NONE);
		await expect(hovered).not.toBe(tint);
		await expect(computed(row('flat', 'odd-action'), 'cursor')).toBe('pointer');
		await expect(hover('flat', 'odd-selected-action')).toBe(hovered);
		await expect(computed(row('flat', 'odd'), 'cursor')).not.toBe('pointer');

		// Striped: the even rows are tinted
		await expect(bg('striped', 'odd')).toBe(NONE);
		await expect(bg('striped', 'even')).toBe(tint);
		// Specificity of the striping rule: it beats a hovered action row...
		await expect(hover('striped', 'odd-action')).toBe(hovered);
		await expect(hover('striped', 'even-action')).toBe(tint);
		// ...but not a hovered selected action row, which keeps the hover colour on an even row too
		await expect(hover('striped', 'even-selected-action')).toBe(hovered);
		await expect(hover('striped', 'odd-selected-action')).toBe(hovered);
	},
};

const selectionWidth = (width: number) => (
	<div style={{ width }}>
		<TableSelection text='A very long selection text that does not fit in the row of a narrow container'>
			<TableSelectionButtonGroup>
				<TableSelectionButton>Archive all selected</TableSelectionButton>
				<TableSelectionButton>Delete all selected</TableSelectionButton>
			</TableSelectionButtonGroup>
		</TableSelection>
	</div>
);

const onSelect = fn();

export const Selection: Story = {
	render: () => (
		<>
			<TableSelection id='selection' className='consumer-class' data-qa='selection-qa' text='3 selected'>
				<TableSelectionButtonGroup>
					<TableSelectionButton onClick={onSelect}>Archive</TableSelectionButton>
					<TableSelectionButton disabled>Delete</TableSelectionButton>
				</TableSelectionButtonGroup>
			</TableSelection>
			<TableSelection id='bare' text='None' />
		</>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '#selection', { 'className': 'consumer-class', 'data-qa': 'selection-qa' });
		await expect(canvasElement.querySelector('#selection .rcx-table__selection-text')).toHaveTextContent('3 selected');
		await expect(canvasElement.querySelectorAll('#selection .rcx-table__selection-button')).toHaveLength(2);
		await expect(canvasElement.querySelector('#bare .rcx-table__selection-actions')).toBeNull();

		onSelect.mockClear();
		const [archive, remove] = [...canvasElement.querySelectorAll<HTMLButtonElement>('#selection button')];
		await userEvent.click(archive);
		await userEvent.click(remove);
		await expect(onSelect).toHaveBeenCalledTimes(1);
		await expect(remove).toBeDisabled();
	},
};

// The action buttons keep the width of their label however narrow the bar gets: the text gives way instead
export const SelectionBehaviour: Story = {
	render: () => (
		<>
			<div id='wide'>{selectionWidth(900)}</div>
			<div id='narrow'>{selectionWidth(320)}</div>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const widths = (id: string) =>
			[...canvasElement.querySelectorAll(`#${id} .rcx-table__selection-button`)].map((button) => button.getBoundingClientRect().width);
		await expect(widths('narrow')).toEqual(widths('wide'));

		const text = canvasElement.querySelector('#narrow .rcx-table__selection-text') as HTMLElement;
		await expect(computed(text, 'text-overflow')).toBe('ellipsis');
		await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
		await expect(computed(canvasElement.querySelector('#narrow .rcx-table__selection') as Element, 'justify-content')).toBe(
			'space-between',
		);
	},
};
