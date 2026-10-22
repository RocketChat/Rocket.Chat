import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScheduledMessageRow from './ScheduledMessageRow';

const appRoot = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			Send_now: 'Send now',
			Retry_now: 'Retry now',
			Send_anyway: 'Send anyway',
			Reschedule: 'Reschedule',
			Edit: 'Edit',
			Delete: 'Delete',
			Copy_text: 'Copy text',
			Options: 'Options',
			Failed: 'Failed',
		})
		.build();

const row = (status: 'pending' | 'failed', error?: string, tmid?: string) => (
	<ScheduledMessageRow
		scheduledMessage={{
			_id: 's1',
			msg: 'see you at **standup**',
			scheduledAt: '2026-10-22T12:00:00.000Z',
			status,
			error,
			tmid,
			u: { _id: 'u1', username: 'alice', name: 'Alice Doe' },
		}}
		onSendNow={jest.fn()}
		onDelete={jest.fn()}
		onReschedule={jest.fn()}
		onEdit={jest.fn()}
	/>
);

const openOptions = async () => {
	await userEvent.click(screen.getByRole('button', { name: 'Options' }));
	return (await screen.findAllByRole('menuitem')).map((item) => item.textContent?.replace(/^[^A-Za-z]+/, ''));
};

describe('ScheduledMessageRow', () => {
	it('reads like a message: author, send time and the rendered text', () => {
		render(row('pending'), { wrapper: appRoot() });

		expect(screen.getByText('Alice Doe')).toBeInTheDocument();
		expect(screen.getByText('see you at standup')).toBeInTheDocument();
		expect(screen.queryByText('Failed')).not.toBeInTheDocument();
	});

	it('offers Edit, Send now, Reschedule and Delete for a pending message', async () => {
		render(row('pending'), { wrapper: appRoot() });

		expect(await openOptions()).toEqual(['Edit', 'Send now', 'Reschedule', 'Delete']);
	});

	it('marks a failed message and keeps Send now when a retry can fix it', async () => {
		render(row('failed', 'You_have_been_muted'), { wrapper: appRoot() });

		expect(screen.getByText('Failed')).toBeInTheDocument();
		expect(screen.getByText('You_have_been_muted')).toBeInTheDocument();
		expect(await openOptions()).toEqual(['Edit', 'Retry now', 'Reschedule', 'Delete']);
	});

	it.each(['room_is_archived', 'room_is_blocked', 'error-invalid-room', 'error-invalid-user', 'error-message-size-exceeded'])(
		'drops Send now when a retry cannot succeed (%s)',
		async (error) => {
			render(row('failed', error), { wrapper: appRoot() });

			expect(await openOptions()).toEqual(['Copy text', 'Delete']);
		},
	);

	it('offers Edit for a thread reply too', async () => {
		render(row('pending', undefined, 'parent'), { wrapper: appRoot() });

		expect(await openOptions()).toEqual(['Edit', 'Send now', 'Reschedule', 'Delete']);
	});

	it('shows each file that will go with the message, with a preview for images', async () => {
		const onEdit = jest.fn();
		render(
			<ScheduledMessageRow
				scheduledMessage={{
					_id: 's1',
					msg: '',
					scheduledAt: '2026-10-22T12:00:00.000Z',
					status: 'pending',
					files: [
						{ _id: 'f1', name: 'a.png', type: 'image/png' },
						{ _id: 'f2', name: 'b.pdf', type: 'application/pdf' },
					],
					u: { _id: 'u1', username: 'alice', name: 'Alice Doe' },
				}}
				onSendNow={jest.fn()}
				onDelete={jest.fn()}
				onReschedule={jest.fn()}
				onEdit={onEdit}
			/>,
			{ wrapper: appRoot() },
		);

		expect(screen.getByRole('group', { name: 'a.png' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'b.pdf' })).toBeInTheDocument();
		expect(screen.getByRole('img', { name: 'a.png' })).toHaveAttribute('src', expect.stringContaining('/file-upload/f1/a.png'));

		await openOptions();
		await userEvent.click(screen.getByRole('menuitem', { name: /Edit/ }));
		expect(onEdit).toHaveBeenCalledWith('s1', '', undefined, [
			{ _id: 'f1', name: 'a.png', type: 'image/png' },
			{ _id: 'f2', name: 'b.pdf', type: 'application/pdf' },
		]);
	});

	it('warns that an interrupted message may already be in the room', async () => {
		render(row('failed', 'error-scheduled-message-interrupted'), { wrapper: appRoot() });

		expect(await openOptions()).toEqual(['Edit', 'Send anyway', 'Reschedule', 'Delete']);
	});
});
