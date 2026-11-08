import { withElementIds } from './withElementIds';

it('gives elements the ids of their block, or empty ones, without overriding the ones they have', () => {
	expect(
		withElementIds([
			{
				type: 'actions',
				appId: 'app',
				blockId: 'block',
				elements: [{ type: 'button' }, { type: 'button', blockId: 'own', actionId: 'go' }],
			},
			{ type: 'section', accessory: { type: 'users_select' } },
			{ type: 'input', blockId: 'name', element: { type: 'plain_text_input', actionId: 'name' } },
		]),
	).toEqual([
		{
			type: 'actions',
			appId: 'app',
			blockId: 'block',
			elements: [
				{ type: 'button', appId: 'app', blockId: 'block', actionId: '' },
				{ type: 'button', appId: 'app', blockId: 'own', actionId: 'go' },
			],
		},
		{ type: 'section', accessory: { type: 'users_select', appId: '', blockId: '', actionId: '' } },
		{ type: 'input', blockId: 'name', element: { type: 'plain_text_input', appId: '', blockId: 'name', actionId: 'name' } },
	]);
});

it('fills the blocks a conditional block renders', () => {
	expect(withElementIds([{ type: 'conditional', render: [{ type: 'actions', blockId: 'b', elements: [{ type: 'button' }] }] }])).toEqual([
		{
			type: 'conditional',
			render: [{ type: 'actions', blockId: 'b', elements: [{ type: 'button', appId: '', blockId: 'b', actionId: '' }] }],
		},
	]);
});

it('leaves values that are not blocks as they are, for the validation to report', () => {
	expect(withElementIds('blocks')).toBe('blocks');
	expect(withElementIds([null, 'text'])).toEqual([null, 'text']);
});

it('gives the buttons of a card, alone or in a carousel, the ids of the card', () => {
	const card = { type: 'card', blockId: 'card', actions: [{ type: 'button' }] };
	const withIds = { type: 'card', blockId: 'card', actions: [{ type: 'button', appId: '', blockId: 'card', actionId: '' }] };

	expect(withElementIds([card, { type: 'carousel', elements: [card] }])).toEqual([withIds, { type: 'carousel', elements: [withIds] }]);
});

it('gives the button of an action cell the ids of its data table', () => {
	const cell = { type: 'action_cell', element: { type: 'button' } };
	const table = { type: 'data_table', appId: 'app', blockId: 'table', rows: [[{ type: 'raw_text', text: 'A' }], [cell]] };

	expect(withElementIds([table])).toEqual([
		{
			...table,
			rows: [
				[{ type: 'raw_text', text: 'A' }],
				[{ type: 'action_cell', element: { type: 'button', appId: 'app', blockId: 'table', actionId: '' } }],
			],
		},
	]);
});

it('keeps the ids a button of an action cell already has and rows that are not lists', () => {
	const cell = { type: 'action_cell', element: { type: 'button', blockId: 'own', actionId: 'go' } };

	expect(withElementIds([{ type: 'data_table', blockId: 'table', rows: [[cell], 'row'] }])).toEqual([
		{
			type: 'data_table',
			blockId: 'table',
			rows: [[{ type: 'action_cell', element: { type: 'button', appId: '', blockId: 'own', actionId: 'go' } }], 'row'],
		},
	]);
});
