import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScheduledMessagesPage from './ScheduledMessagesPage';

const goToRoom = jest.fn();

jest.mock('../room/hooks/useGoToRoom', () => ({
	useGoToRoom: () => goToRoom,
}));

const roomNames: Record<string, { name: string; fname: string }> = {
	general: { name: 'general', fname: 'general' },
	dm: { name: 'ana.tokyo', fname: 'Ana Tokyo' },
};

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserSubscription: (rid: string) => roomNames[rid],
}));

const item = (_id: string, rid: string, status: 'pending' | 'failed' = 'pending') => ({
	_id,
	rid,
	msg: `message ${_id}`,
	status,
	scheduledAt: '2026-10-22T12:00:00.000Z',
	u: { _id: 'john.doe', username: 'john.doe', name: 'John Doe' },
});

const appRoot = () =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', { Scheduled_messages: 'Scheduled messages', All: 'All', Failed: 'Failed', Open_room: 'Open room' })
		.withEndpoint('GET', '/v1/scheduledMessages.list', () => ({
			scheduledMessages: [
				item('a', 'general'),
				item('b', 'dm'),
				item('c', 'general', 'failed'),
				{ ...item('d', 'left-room', 'failed'), roomName: 'Release team', roomType: 'p' },
			] as never,
			total: 4,
			offset: 0,
			count: 4,
		}))
		.build();

describe('ScheduledMessagesPage', () => {
	beforeEach(() => goToRoom.mockReset());

	it('groups the pending messages of every room under the room name', async () => {
		render(<ScheduledMessagesPage />, { wrapper: appRoot() });

		const general = await screen.findByRole('region', { name: 'general' });
		expect(within(general).getByText('message a')).toBeInTheDocument();
		expect(within(general).getByText('message c')).toBeInTheDocument();
		expect(within(screen.getByRole('region', { name: 'Ana Tokyo' })).getByText('message b')).toBeInTheDocument();
	});

	it('names a room the author no longer belongs to', async () => {
		render(<ScheduledMessagesPage />, { wrapper: appRoot() });

		expect(within(await screen.findByRole('region', { name: 'Release team' })).getByText('message d')).toBeInTheDocument();
	});

	it('shows only failed messages on the Failed tab', async () => {
		render(<ScheduledMessagesPage />, { wrapper: appRoot() });
		await screen.findByText('message a');

		await userEvent.click(screen.getByRole('tab', { name: /Failed/ }));

		expect(screen.getByText('message c')).toBeInTheDocument();
		expect(screen.queryByText('message a')).not.toBeInTheDocument();
		expect(screen.queryByText('message b')).not.toBeInTheDocument();
	});

	it('opens the room of a group', async () => {
		render(<ScheduledMessagesPage />, { wrapper: appRoot() });

		await userEvent.click(within(await screen.findByRole('region', { name: 'Ana Tokyo' })).getByRole('button', { name: 'Open room' }));

		expect(goToRoom).toHaveBeenCalledWith('dm');
	});
});
