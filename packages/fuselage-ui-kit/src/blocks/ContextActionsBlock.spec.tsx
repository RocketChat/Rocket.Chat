import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { messageParser, modalParser } from '../surfaces';

it('renders its icon buttons and sends a block action with the block id when one is clicked', async () => {
	const action = jest.fn();

	render(
		<MockedServerContext>
			<UiKitContext.Provider value={{ action, updateState: jest.fn(), values: {}, appId: 'app' }}>
				{messageParser.render([
					// Elements without appId or blockId take the block's.
					{
						type: 'context_actions',
						blockId: 'message-actions',
						elements: [
							{
								type: 'icon_button',
								actionId: 'more-info',
								icon: { type: 'icon', icon: 'info', variant: 'default' },
								label: 'More info',
								value: 'info',
							},
						],
					},
				] as any)}
			</UiKitContext.Provider>
		</MockedServerContext>,
	);

	await userEvent.click(screen.getByRole('button', { name: 'More info' }));

	expect(action).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'more-info', blockId: 'message-actions' }), expect.anything());
});

it('renders nothing in a modal, which does not accept context actions', () => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'context_actions',
					elements: [{ type: 'icon_button', actionId: 'x', icon: { type: 'icon', icon: 'info', variant: 'default' }, label: 'More info' }],
				},
			] as any)}
		</MockedServerContext>,
	);

	expect(screen.queryByRole('button', { name: 'More info' })).not.toBeInTheDocument();
});
