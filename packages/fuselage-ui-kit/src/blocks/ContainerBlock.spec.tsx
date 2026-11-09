import { MockedServerContext, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { bannerParser, messageParser, modalParser } from '../surfaces';

const text = (value: string) => ({ type: 'plain_text', text: value });

const container = (extra: object = {}) =>
	({
		type: 'container',
		blockId: 'box',
		title: text('Bulk update'),
		subtitle: text('Review changes'),
		child_blocks: [
			{ type: 'section', text: text('Record one') },
			{ type: 'actions', elements: [{ type: 'button', actionId: 'confirm', text: text('Confirm') }] },
		],
		...extra,
	}) as never;

it('renders the title, the subtitle and the children, and sends the actions of nested buttons', async () => {
	const action = jest.fn();

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {}, appId: 'app' }}>
				{messageParser.render([container()])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	expect(screen.getByRole('heading', { name: 'Bulk update' })).toBeInTheDocument();
	expect(screen.getByText('Review changes')).toBeInTheDocument();
	expect(screen.getByText('Record one')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'confirm', appId: 'app' }), expect.anything());
});

it('is not collapsible unless asked to', () => {
	render(<MockedServerContext>{messageParser.render([container({ default_collapsed: true })])}</MockedServerContext>);

	expect(screen.queryByRole('button', { name: /Collapse|Expand/ })).not.toBeInTheDocument();
	expect(screen.getByText('Record one')).toBeVisible();
});

it('collapses and expands with a button that says which content it controls', async () => {
	render(<MockedServerContext>{messageParser.render([container({ is_collapsible: true })])}</MockedServerContext>);

	const toggle = screen.getByRole('button', { name: 'Collapse' });
	const content = screen.getByText('Record one').closest('[id]') as HTMLElement;

	expect(toggle).toHaveAttribute('aria-expanded', 'true');
	expect(toggle).toHaveAttribute('aria-controls', content.id);

	await userEvent.click(toggle);

	expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false');
	expect(screen.getByText('Record one')).not.toBeVisible();

	await userEvent.click(screen.getByRole('button', { name: 'Expand' }));

	expect(screen.getByText('Record one')).toBeVisible();
});

it('starts collapsed when default_collapsed is set', () => {
	render(<MockedServerContext>{messageParser.render([container({ is_collapsible: true, default_collapsed: true })])}</MockedServerContext>);

	expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false');
	expect(screen.getByText('Record one')).not.toBeVisible();
});

it('prefers the rich text title over the plain one', () => {
	render(
		<MockedServerContext>
			{messageParser.render([
				container({
					rich_text_title: {
						type: 'rich_text',
						elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Rich title' }] }],
					},
				}),
			])}
		</MockedServerContext>,
	);

	expect(screen.getByRole('heading', { name: 'Rich title' })).toBeInTheDocument();
	expect(screen.queryByText('Bulk update')).not.toBeInTheDocument();
});

it('draws only the children the container and the surface accept', () => {
	const children = [
		{ type: 'section', text: text('Kept') },
		{ type: 'markdown', text: 'Not a container child' },
		{ type: 'file', fileId: 'f' },
	];

	const { unmount } = render(<MockedServerContext>{modalParser.render([container({ child_blocks: children })])}</MockedServerContext>);

	expect(screen.getByText('Kept')).toBeInTheDocument();
	expect(screen.queryByText('Not a container child')).not.toBeInTheDocument();
	unmount();

	render(<MockedServerContext>{bannerParser.render([container()])}</MockedServerContext>);
	expect(screen.queryByRole('heading', { name: 'Bulk update' })).not.toBeInTheDocument();
});

it('keeps the value of an input nested in a container and a layout in the view state of a modal', async () => {
	const updateState = jest.fn();
	const layout = {
		type: 'layout',
		label: 'Form',
		rows: [
			{
				items: [
					{
						block: container({
							child_blocks: [
								{
									type: 'input',
									blockId: 'name-block',
									label: text('Name'),
									element: { type: 'plain_text_input', actionId: 'name' },
								},
							],
						}),
					},
				],
			},
		],
	} as never;

	render(
		<UiKitContext.Provider value={{ action: jest.fn(), updateState, values: {}, viewId: 'view' }}>
			{modalParser.render([layout])}
		</UiKitContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);

	await userEvent.type(screen.getByRole('textbox'), 'Ada');

	expect(updateState).toHaveBeenLastCalledWith(
		expect.objectContaining({ actionId: 'name', blockId: 'name-block', value: 'Ada', viewId: 'view' }),
		expect.anything(),
	);
});

it('sends the appId of the container for a nested button when the context has none', async () => {
	const action = jest.fn();

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {} }}>
				{messageParser.render([container({ appId: 'sender-app' })])}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'confirm', appId: 'sender-app' }), expect.anything());
});

it('draws only a rich_text block as the rich title', () => {
	render(
		<MockedServerContext>
			{messageParser.render([container({ title: text('Plain title'), rich_text_title: { type: 'divider' } })])}
		</MockedServerContext>,
	);

	expect(screen.getAllByRole('heading')).toHaveLength(1);
	expect(screen.getByRole('heading', { name: 'Plain title' })).toBeInTheDocument();
	expect(screen.queryByRole('separator')).not.toBeInTheDocument();
});

it('draws no heading when neither title renders anything', () => {
	render(
		<MockedServerContext>
			{messageParser.render([container({ title: undefined, rich_text_title: { type: 'container' } })])}
		</MockedServerContext>,
	);

	expect(screen.queryByRole('heading')).not.toBeInTheDocument();
});

it.each([
	[undefined, 'var(--rcx-message-block-width-fixed, 368px)'],
	['standard', 'var(--rcx-message-block-width-fixed, 368px)'],
	['narrow', '280px'],
	['wide', '640px'],
	['full', ''],
] as const)('limits a %s container to %s', (width, maxWidth) => {
	render(<MockedServerContext>{modalParser.render([container({ width })])}</MockedServerContext>);

	const box = screen.getByRole('heading', { name: 'Bulk update' }).parentElement?.parentElement?.parentElement;

	expect(box && getComputedStyle(box).maxWidth).toBe(maxWidth);
});
