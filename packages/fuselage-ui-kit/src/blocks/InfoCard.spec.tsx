import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UiKitContext } from '../contexts/UiKitContext';
import { messageParser } from '../surfaces';

const card: UiKit.InfoCardBlock = {
	type: 'info_card',
	appId: 'calls-app',
	blockId: 'call-summary',
	rows: [
		{
			background: 'default',
			elements: [
				{ type: 'icon', icon: 'phone', variant: 'default' },
				{ type: 'plain_text', text: 'Call ended' },
			],
			action: {
				type: 'icon_button',
				appId: 'calls-app',
				blockId: 'call-summary',
				actionId: 'call-details',
				label: 'Details',
				value: 'call-1',
				icon: { type: 'icon', icon: 'info', variant: 'default' },
			},
		},
		{
			background: 'secondary',
			elements: [{ type: 'mrkdwn', text: 'Lasted 5 minutes' }],
		},
	],
};

it('shows the text of each row and sends the action of a row when its button is clicked', async () => {
	const action = jest.fn();
	render(<UiKitContext.Provider value={{ action, values: {} }}>{messageParser.render([card])}</UiKitContext.Provider>);

	expect(screen.getByText('Call ended')).toBeInTheDocument();
	expect(screen.getByText('Lasted 5 minutes')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Details' }));

	expect(action).toHaveBeenCalledWith(
		expect.objectContaining({ appId: 'calls-app', blockId: 'call-summary', actionId: 'call-details', value: 'call-1' }),
		expect.anything(),
	);
});
