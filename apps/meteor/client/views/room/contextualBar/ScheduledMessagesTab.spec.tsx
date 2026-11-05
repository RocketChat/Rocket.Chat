import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScheduledMessagesTab from './ScheduledMessagesTab';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';

jest.mock('../../../lib/e2ee', () => ({ e2e: {} }));

const pending = {
	_id: 's1',
	rid: 'rid',
	msg: 'see you at standup',
	scheduledAt: '2026-10-22T12:00:00.000Z',
	status: 'pending',
};
const failed = { ...pending, _id: 's2', msg: 'release freeze', status: 'failed', error: 'error-not-allowed' };
const elsewhere = { ...pending, _id: 's3', rid: 'other', msg: 'lunch order' };

const list = jest.fn();
const sendNow = jest.fn();
const remove = jest.fn();
const update = jest.fn();

const appRoot = () =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', {
			'Send_now': 'Send now',
			'Delete': 'Delete',
			'Options': 'Options',
			'Reschedule': 'Reschedule',
			'Schedule': 'Schedule',
			'Yes_delete_it': 'Yes, delete',
			'Are_you_sure': 'Are you sure?',
			'No_scheduled_messages': 'No scheduled messages',
			'error-not-allowed': 'Not allowed',
		})
		.withExperimentalEndpoint('GET', '/experimental/scheduledMessages.list', (params) => list(params))
		.withExperimentalEndpoint('POST', '/experimental/scheduledMessages.sendNow', (params) => sendNow(params))
		.withExperimentalEndpoint('POST', '/experimental/scheduledMessages.delete', (params) => remove(params))
		.withExperimentalEndpoint('POST', '/experimental/scheduledMessages.update', (params) => update(params))
		.wrap((children) => <FakeRoomProvider roomOverrides={{ _id: 'rid' }}>{children}</FakeRoomProvider>)
		.build();

describe('ScheduledMessagesTab', () => {
	beforeEach(() => {
		list.mockReset().mockResolvedValue({ scheduledMessages: [pending, failed, elsewhere], total: 3, offset: 0, count: 3 });
		sendNow.mockReset().mockResolvedValue({ message: { _id: 'm1' } });
		remove.mockReset().mockResolvedValue({});
		update.mockReset().mockResolvedValue({ scheduledMessage: { ...pending, scheduledAt: '2026-10-23T12:00:00.000Z' } });
	});

	it('lists the pending items of the room, with the reason of a failed one', async () => {
		render(<ScheduledMessagesTab />, { wrapper: appRoot() });

		expect(await screen.findByText('see you at standup')).toBeInTheDocument();
		expect(screen.getByText('release freeze')).toBeInTheDocument();
		expect(screen.getByText('Not allowed')).toBeInTheDocument();
		expect(screen.queryByText('lunch order')).not.toBeInTheDocument();
	});

	it('sends an item now', async () => {
		render(<ScheduledMessagesTab />, { wrapper: appRoot() });

		await userEvent.click((await screen.findAllByRole('button', { name: 'Options' }))[0]);
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Send now' }));

		expect(sendNow).toHaveBeenCalledWith({ scheduledMessageId: 's1' });
	});

	it('deletes an item only after the user confirms', async () => {
		render(<ScheduledMessagesTab />, { wrapper: appRoot() });

		await userEvent.click((await screen.findAllByRole('button', { name: 'Options' }))[0]);
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
		expect(remove).not.toHaveBeenCalled();

		await userEvent.click(
			within(await screen.findByRole('dialog', { name: 'Are you sure?' })).getByRole('button', { name: 'Yes, delete' }),
		);

		expect(remove).toHaveBeenCalledWith({ scheduledMessageId: 's1' });
	});

	it('reschedules an item to the time picked in the modal', async () => {
		render(<ScheduledMessagesTab />, { wrapper: appRoot() });

		await userEvent.click((await screen.findAllByRole('button', { name: 'Options' }))[0]);
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Reschedule' }));
		await userEvent.click(
			within(await screen.findByRole('dialog', { name: 'Schedule_message' })).getByRole('button', { name: 'Schedule' }),
		);

		await waitFor(() => expect(update).toHaveBeenCalledWith({ scheduledMessageId: 's1', scheduledAt: expect.any(String) }));
	});

	it('shows an empty state when nothing is scheduled', async () => {
		list.mockResolvedValue({ scheduledMessages: [], total: 0, offset: 0, count: 0 });
		render(<ScheduledMessagesTab />, { wrapper: appRoot() });

		expect(await screen.findByText('No scheduled messages')).toBeInTheDocument();
	});
});
