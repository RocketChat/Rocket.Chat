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
