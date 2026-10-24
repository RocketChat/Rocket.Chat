import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import NavBarItemScheduledMessages from './NavBarItemScheduledMessages';

const list = jest.fn();

const appRoot = (total: number) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Message_Scheduling_Enabled', true)
		.withPermission('schedule-message')
		.withEndpoint('GET', '/v1/scheduledMessages.list', (params) => {
			list(params);
			return {
				scheduledMessages: Array.from({ length: total }, (_, i) => ({ _id: `s${i}`, rid: 'r', msg: 'm', status: 'pending' })) as never,
				total,
				offset: 0,
				count: total,
			};
		})
		.build();

describe('NavBarItemScheduledMessages', () => {
	beforeEach(() => list.mockReset());

	it('gives a shortcut to the scheduled messages page while the user has some', async () => {
		render(<NavBarItemScheduledMessages title='Scheduled messages' />, { wrapper: appRoot(2) });

		expect(await screen.findByRole('button', { name: 'Scheduled messages' })).toBeInTheDocument();
	});

	it('stays hidden while nothing is scheduled', async () => {
		render(<NavBarItemScheduledMessages title='Scheduled messages' />, { wrapper: appRoot(0) });

		await waitFor(() => expect(list).toHaveBeenCalled());
		expect(screen.queryByRole('button', { name: 'Scheduled messages' })).not.toBeInTheDocument();
	});
});
