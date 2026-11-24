import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { bannerParser, messageParser, modalParser } from '../surfaces';

const text = (value: string) => ({ type: 'plain_text', text: value });
const section = (value: string) => ({ type: 'header', text: text(value) });

const layout = (extra: object = {}) =>
	({
		type: 'layout',
		label: 'Deal summary',
		rows: [
			{ items: [{ block: section('Stage') }, { block: section('Amount'), width: 'wide', horizontal_alignment: 'end' }] },
			{ items: [{ block: section('Next steps'), width: 'narrow', horizontal_alignment: 'center' }] },
		],
		fallback: [section('Fallback copy')],
		...extra,
	}) as never;

const cellOf = (value: string) => screen.getByRole('heading', { name: value }).parentElement as HTMLElement;

it('renders every item in source order, never the fallback, and nothing for a label that is not visible', () => {
	render(<MockedServerContext>{messageParser.render([layout()])}</MockedServerContext>);

	const items = ['Stage', 'Amount', 'Next steps'].map((value) => screen.getByRole('heading', { name: value }));

	items
		.slice(1)
		.forEach((item, index) => expect(items[index].compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
	expect(screen.queryByRole('heading', { name: 'Fallback copy' })).not.toBeInTheDocument();
	expect(screen.queryByText('Deal summary')).not.toBeInTheDocument();
});

it('shows the label as plain bold text, without a heading or group role', () => {
	render(<MockedServerContext>{messageParser.render([layout({ is_label_visible: true })])}</MockedServerContext>);

	expect(screen.getByText('Deal summary')).toBeInTheDocument();
	expect(screen.queryByRole('heading', { name: 'Deal summary' })).not.toBeInTheDocument();
	expect(screen.queryByRole('group')).not.toBeInTheDocument();
	expect(screen.queryByRole('table')).not.toBeInTheDocument();
	expect(screen.queryByRole('grid')).not.toBeInTheDocument();
});

it('weighs the width of the items as narrow 1, standard 2 and wide 3', () => {
	render(<MockedServerContext>{messageParser.render([layout()])}</MockedServerContext>);

	expect(cellOf('Stage')).toHaveStyle({ flexGrow: '2' });
	expect(cellOf('Amount')).toHaveStyle({ flexGrow: '3' });
	expect(cellOf('Next steps')).toHaveStyle({ flexGrow: '1' });
});

it('aligns the content of an item with the start or end of the cell, following the text direction', () => {
	render(<MockedServerContext>{messageParser.render([layout()])}</MockedServerContext>);

	expect(cellOf('Stage')).not.toHaveStyle({ alignItems: 'flex-start' });
	expect(cellOf('Amount')).toHaveStyle({ alignItems: 'flex-end' });
	expect(cellOf('Next steps')).toHaveStyle({ alignItems: 'center' });
});

it('draws a separator between rows only for the rows grid lines', () => {
	const { rerender } = render(<MockedServerContext>{messageParser.render([layout()])}</MockedServerContext>);
	expect(screen.queryAllByRole('separator')).toHaveLength(0);

	rerender(<MockedServerContext>{messageParser.render([layout({ grid_lines: 'outer' })])}</MockedServerContext>);
	expect(screen.queryAllByRole('separator')).toHaveLength(0);

	rerender(<MockedServerContext>{messageParser.render([layout({ grid_lines: 'rows' })])}</MockedServerContext>);
	expect(screen.getAllByRole('separator')).toHaveLength(1);
});

it('draws only the items the layout and the surface accept', () => {
	const rows = [
		{ items: [{ block: section('Kept') }, { block: { type: 'markdown', text: 'Not an item' } }, { block: { type: 'file', fileId: 'f' } }] },
	];

	const { unmount } = render(<MockedServerContext>{modalParser.render([layout({ rows })])}</MockedServerContext>);

	expect(screen.getByRole('heading', { name: 'Kept' })).toBeInTheDocument();
	expect(screen.queryByText('Not an item')).not.toBeInTheDocument();
	unmount();

	render(<MockedServerContext>{bannerParser.render([layout()])}</MockedServerContext>);
	expect(screen.queryByRole('heading', { name: 'Stage' })).not.toBeInTheDocument();
});

it('skips the items of a row that are not objects', () => {
	render(
		<MockedServerContext>
			{messageParser.render([layout({ rows: [{ items: [null, 'item', { block: section('Kept') }] }] })])}
		</MockedServerContext>,
	);

	expect(screen.getByRole('heading', { name: 'Kept' })).toBeInTheDocument();
});
