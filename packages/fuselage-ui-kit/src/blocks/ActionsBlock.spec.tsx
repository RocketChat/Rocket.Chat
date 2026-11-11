import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { UiKitContext } from '../contexts/UiKitContext';
import { messageParser } from '../surfaces';

const renderActions = (elements: unknown[]) =>
	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action: jest.fn(), updateState: jest.fn(), values: {}, appId: 'app' }}>
				{messageParser.render([{ type: 'actions', blockId: 'release', elements }] as any)}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

it('keeps the overflow menu at its own size next to the buttons', () => {
	renderActions([
		{ type: 'button', actionId: 'approve', text: { type: 'plain_text', text: 'Approve' } },
		{
			type: 'overflow',
			actionId: 'more',
			options: [{ value: 'logs', text: { type: 'plain_text', text: 'View logs' } }],
		},
	]);

	const [, overflow] = screen.getAllByRole('button');
	const slot = overflow.parentElement as HTMLElement;

	expect(getComputedStyle(slot).flexGrow).not.toBe('1');
	expect(getComputedStyle(slot).flexBasis).not.toBe('45%');
});
