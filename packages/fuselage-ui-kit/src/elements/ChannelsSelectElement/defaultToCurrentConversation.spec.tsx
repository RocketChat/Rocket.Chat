import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { UiKitContext } from '../../contexts/UiKitContext';
import { contextualBarParser } from '../../surfaces';

const subscriptions = [
	{ rid: 'GENERAL', name: 'general', t: 'c' },
	{ rid: 'dm1', name: 'john.doe', fname: 'John Doe', t: 'd' },
];

const mountSelect = (element: UiKit.InputBlock['element'], updateState = jest.fn()) => {
	render(
		<UiKitContext.Provider value={{ action: jest.fn(), updateState, values: {}, appId: 'app', viewId: 'view', rid: 'GENERAL' }}>
			{contextualBarParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Where' }, element }])}
		</UiKitContext.Provider>,
		{
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/subscriptions.get', () => ({ update: subscriptions, remove: [] }) as any)
				.build(),
		},
	);
	return updateState;
};

const ids = { appId: 'app', blockId: 'block', actionId: 'where' };

it.each([
	['conversations_select', { ...ids, type: 'conversations_select', default_to_current_conversation: true }, 'GENERAL'],
	['multi_conversations_select', { ...ids, type: 'multi_conversations_select', default_to_current_conversation: true }, ['GENERAL']],
] as [string, UiKit.InputBlock['element'], unknown][])(
	'a %s starts with the current room selected and in the view state',
	async (_type, element, value) => {
		const updateState = mountSelect(element);

		expect(await screen.findByText('general')).toBeInTheDocument();
		expect(updateState).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'where', value }), undefined);
	},
);

it('keeps the initial selection when there is one', async () => {
	const updateState = mountSelect({
		...ids,
		type: 'conversations_select',
		default_to_current_conversation: true,
		initial_conversation: 'dm1',
	});

	expect(await screen.findByText('John Doe')).toBeInTheDocument();
	expect(updateState).not.toHaveBeenCalled();
});
