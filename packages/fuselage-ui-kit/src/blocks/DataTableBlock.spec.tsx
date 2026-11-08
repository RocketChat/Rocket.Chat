import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { bannerParser, messageParser, modalParser } from '../surfaces';

const text = (value: string) => ({ type: 'raw_text', text: value });
const number = (value: number, shown?: string) => ({ type: 'raw_number', value, ...(shown && { text: shown }) });
const action = (label: string, value: string) => ({
	type: 'action_cell',
	element: { type: 'button', actionId: 'open', value, text: { type: 'plain_text', text: label } },
});

const people = [
	['Carol', 30],
	['alice', 4],
	['Bob', 100],
];

const dataTable = (extra: object = {}) =>
	({
		type: 'data_table',
		blockId: 'people',
		caption: 'People',
		rows: [
			[text('Name'), text('Age'), text('Action')],
			...people.map(([name, age]) => [text(String(name)), number(Number(age)), action('Open', String(name))]),
		],
		...extra,
	}) as never;

const renderTable = (block = dataTable(), action = jest.fn()) =>
	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {}, appId: 'app' }}>
				{messageParser.render([block])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

const names = () =>
	within(screen.getAllByRole('rowgroup')[1])
		.queryAllByRole('rowheader')
		.map((cell) => cell.textContent);

it('renders the caption, the column headers and the first column as the row header', () => {
	renderTable();

	expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument();
	expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent?.replace(/\p{Co}/gu, ''))).toEqual(['Name', 'Age', 'Action']);
	expect(names()).toEqual(['Carol', 'alice', 'Bob']);
	expect(screen.getAllByRole('rowheader')[0]).toHaveAttribute('scope', 'row');
});

it('uses the column given by row_header_column_index as the row header', () => {
	renderTable(dataTable({ row_header_column_index: 1 }));

	expect(
		within(screen.getAllByRole('rowgroup')[1])
			.queryAllByRole('rowheader')
			.map((cell) => cell.textContent),
	).toEqual(['30', '4', '100']);
});

it('shows the text of a number instead of its value and the content of a rich text cell', async () => {
	renderTable(
		dataTable({
			rows: [
				[text('Item'), text('Price'), text('Note')],
				[
					text('Pen'),
					number(2, '$2.00'),
					{
						type: 'rich_text',
						elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Blue', style: { bold: true } }] }],
					},
				],
			],
		}),
	);

	expect(screen.getByText('$2.00')).toBeInTheDocument();
	expect(screen.queryByText('2')).not.toBeInTheDocument();
	expect(await screen.findByText('Blue')).toBeInTheDocument();
});

it('shows page_size rows per page and moves between pages', async () => {
	renderTable(dataTable({ page_size: 2 }));

	expect(names()).toEqual(['Carol', 'alice']);
	expect(screen.getByText('Showing_results_of')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'UIKit_Data_table_previous_page' })).toBeDisabled();

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Data_table_next_page' }));

	expect(names()).toEqual(['Bob']);
	expect(screen.getByRole('button', { name: 'UIKit_Data_table_next_page' })).toBeDisabled();

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Data_table_previous_page' }));

	expect(names()).toEqual(['Carol', 'alice']);
});

it('shows 5 rows per page when page_size is missing or out of range', () => {
	const rows = [[text('N')], ...Array.from({ length: 7 }, (_, index) => [text(`row ${index}`)])];

	const { unmount } = renderTable(dataTable({ rows }));
	expect(names()).toHaveLength(5);
	unmount();

	renderTable(dataTable({ rows, page_size: 500 }));
	expect(names()).toHaveLength(5);
});

it('sorts a column of numbers numerically and toggles the direction', async () => {
	renderTable();
	const ageHeader = screen.getByRole('columnheader', { name: /Age/ });

	expect(ageHeader).not.toHaveAttribute('aria-sort');

	await userEvent.click(within(ageHeader).getByRole('button', { name: 'UIKit_Data_table_sort' }));

	expect(ageHeader).toHaveAttribute('aria-sort', 'ascending');
	expect(names()).toEqual(['alice', 'Carol', 'Bob']);

	await userEvent.click(within(ageHeader).getByRole('button'));

	expect(ageHeader).toHaveAttribute('aria-sort', 'descending');
	expect(names()).toEqual(['Bob', 'Carol', 'alice']);
});

it('sorts a column that is not all numbers alphabetically', async () => {
	renderTable();

	await userEvent.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));

	expect(names()).toEqual(['alice', 'Bob', 'Carol']);
});

it('sorts as text when a number column has a cell that is not a number', async () => {
	renderTable(dataTable({ rows: [[text('N')], [number(30)], [number(4)], [text('x')]] }));

	await userEvent.click(within(screen.getByRole('columnheader')).getByRole('button'));

	expect(
		within(screen.getAllByRole('rowgroup')[1])
			.queryAllByRole('rowheader')
			.map((cell) => cell.textContent),
	).toEqual(['30', '4', 'x']);
});

it('filters the rows by their visible text, whatever the case, and goes back to the first page', async () => {
	renderTable(dataTable({ page_size: 1 }));

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Data_table_next_page' }));
	await userEvent.type(screen.getByRole('searchbox', { name: 'Filter' }), 'BO');

	expect(names()).toEqual(['Bob']);

	await userEvent.clear(screen.getByRole('searchbox'));
	await userEvent.type(screen.getByRole('searchbox'), 'nobody');

	expect(names()).toEqual([]);
});

it('sends a block action with the button value and the block id when a button in a cell is clicked', async () => {
	const onAction = jest.fn();

	renderTable(dataTable(), onAction);

	await userEvent.click(within(screen.getAllByRole('row')[2]).getByRole('button', { name: 'Open' }));

	expect(onAction).toHaveBeenCalledWith(
		expect.objectContaining({ actionId: 'open', blockId: 'people', value: 'alice' }),
		expect.anything(),
	);
});

it('renders in a modal and not in a banner', () => {
	const { unmount } = render(<MockedServerContext>{modalParser.render([dataTable()])}</MockedServerContext>);
	expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument();
	unmount();

	render(<MockedServerContext>{bannerParser.render([dataTable()])}</MockedServerContext>);
	expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it.each([
	['rows that are not a list', 'rows'],
	['a row that is not a list', [[text('N')], 'row']],
	[
		'cells that are not objects',
		[
			[null, 'cell'],
			[null, 5],
		],
	],
	['a button cell without a button', [[text('N')], [{ type: 'action_cell', element: { type: 'divider' } }]]],
])('renders %s without throwing', (_, rows) => {
	render(<MockedServerContext>{messageParser.render([{ type: 'data_table', caption: 'T', rows } as never])}</MockedServerContext>);

	expect(screen.getByRole('table')).toBeInTheDocument();
});

it('draws at most 20 columns and 200 body rows', async () => {
	const header = Array.from({ length: 30 }, (_, index) => text(`h${index}`));
	const body = Array.from({ length: 300 }, (_, row) => Array.from({ length: 30 }, (__, column) => text(`r${row}c${column}`)));

	renderTable(dataTable({ rows: [header, ...body], page_size: 100 }));

	expect(screen.getAllByRole('columnheader')).toHaveLength(20);
	expect(within(screen.getAllByRole('row')[1]).getAllByRole('cell')).toHaveLength(19);

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Data_table_next_page' }));

	expect(screen.getByRole('button', { name: 'UIKit_Data_table_next_page' })).toBeDisabled();
	expect(names()).toHaveLength(100);
	expect(names()[99]).toBe('r199c0');
});

it('leaves the cells a short row lacks empty', () => {
	renderTable(dataTable({ rows: [[text('A'), text('B')], [text('only')]] }));

	expect(within(screen.getAllByRole('row')[1]).getAllByRole('rowheader')).toHaveLength(1);
});

it('keeps a row, and so its state, when the table is sorted', async () => {
	renderTable();

	const bob = screen.getByRole('rowheader', { name: 'Bob' }).closest('tr');

	await userEvent.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));

	expect(names()).toEqual(['alice', 'Bob', 'Carol']);
	expect(screen.getByRole('rowheader', { name: 'Bob' }).closest('tr')).toBe(bob);
});

it('decides how a column sorts from all of its rows, not only the ones the filter leaves', async () => {
	renderTable(dataTable({ rows: [[text('N')], [number(30)], [number(4)], [number(100)], [text('x')]] }));

	await userEvent.type(screen.getByRole('searchbox', { name: 'Filter' }), '0');
	await userEvent.click(within(screen.getByRole('columnheader')).getByRole('button'));

	expect(names()).toEqual(['100', '30']);
});

it('filters only over the columns it draws', async () => {
	const header = Array.from({ length: 21 }, (_, index) => text(`h${index}`));
	const row = Array.from({ length: 21 }, (_, index) => text(index === 20 ? 'hidden-needle' : 'plain'));

	renderTable(dataTable({ rows: [header, row] }));

	await userEvent.type(screen.getByRole('searchbox', { name: 'Filter' }), 'needle');

	expect(names()).toEqual([]);
});
