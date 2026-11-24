import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { UiKitContext } from '../../contexts/UiKitContext';
import { contextualBarParser } from '../../surfaces';
import { createUiKitViewState } from '../../utils/createUiKitViewState';
import type { UiKitViewState } from '../../utils/createUiKitViewState';

const subscriptions = [
	{ rid: 'GENERAL', name: 'general', t: 'c' },
	{ rid: 'dm1', name: 'john.doe', fname: 'John Doe', t: 'd' },
];

const inputBlock = (element: UiKit.InputBlock['element']) =>
	[{ type: 'input', label: { type: 'plain_text', text: 'Where' }, element }] as UiKit.LayoutBlock[];

const renderBlocks = (blocks: UiKit.LayoutBlock[], viewState?: UiKitViewState) =>
	render(
		<UiKitContext.Provider value={{ action: jest.fn(), viewState, appId: 'app', viewId: 'view', rid: 'GENERAL' }}>
			{contextualBarParser.render(blocks)}
		</UiKitContext.Provider>,
		{
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/subscriptions.get', () => ({ update: subscriptions, remove: [] }) as any)
				.build(),
		},
	);

/** Renders the select the way a surface does: with a view state seeded from the same blocks, in the room on screen. */
const mountSelect = (element: UiKit.InputBlock['element']) => {
	const blocks = inputBlock(element);
	const viewState = createUiKitViewState(blocks, 'GENERAL');
	renderBlocks(blocks, viewState);
	return viewState;
};

const ids = { appId: 'app', blockId: 'block', actionId: 'where' };

const defaultingSelects = [
	['conversations_select', { ...ids, type: 'conversations_select', default_to_current_conversation: true }, 'GENERAL'],
	['multi_conversations_select', { ...ids, type: 'multi_conversations_select', default_to_current_conversation: true }, ['GENERAL']],
] as [string, UiKit.InputBlock['element'], unknown][];

it.each(defaultingSelects)('a %s starts with the current room selected and in the view state', async (_type, element, value) => {
	const viewState = mountSelect(element);

	expect(await screen.findByText('general')).toBeInTheDocument();
	expect(viewState.getValue('where')?.value).toEqual(value);
});

it.each(defaultingSelects)('a %s starts with the current room selected in a surface without view state', async (_type, element) => {
	renderBlocks(inputBlock(element));

	expect(await screen.findByText('general')).toBeInTheDocument();
});

it('keeps the initial selection when there is one', async () => {
	const viewState = mountSelect({
		...ids,
		type: 'conversations_select',
		default_to_current_conversation: true,
		initial_conversation: 'dm1',
	});

	expect(await screen.findByText('John Doe')).toBeInTheDocument();
	expect(viewState.getValue('where')?.value).toBe('dm1');
});
