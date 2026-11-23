import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import ScheduledMessageRow from './ScheduledMessageRow';

const decrypt = jest.fn(async () => ({ msg: 'decrypted plan' }));
const getState = jest.fn(() => 'READY');

jest.mock('../../lib/e2ee', () => ({
	e2e: {
		getInstanceByRoomId: async () => ({ decrypt, getState, onStateChange: () => () => undefined }),
	},
}));

const appRoot = () =>
	mockAppRoot()
		.withJohnDoe()
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

type RowProps = ComponentProps<typeof ScheduledMessageRow>;

const row = (overrides: Partial<RowProps['scheduledMessage']> = {}, props: Partial<RowProps> = {}) => (
	<ScheduledMessageRow
		scheduledMessage={{
			_id: 's1',
			rid: 'r1',
			msg: 'see you at **standup**',
			scheduledAt: '2026-10-22T12:00:00.000Z',
			status: 'pending',
			...overrides,
		}}
		onSendNow={jest.fn()}
		onDelete={jest.fn()}
		onReschedule={jest.fn()}
		onEdit={jest.fn()}
		{...props}
	/>
);

const openOptions = async () => {
	await userEvent.click(screen.getByRole('button', { name: 'Options' }));
	return (await screen.findAllByRole('menuitem')).map((item) => item.textContent?.replace(/^[^A-Za-z]+/, ''));
};

describe('ScheduledMessageRow', () => {
	it('reads like a message: author, send time and the rendered text', () => {
		render(row(), { wrapper: appRoot() });

		expect(screen.getByText('John Doe')).toBeInTheDocument();
		expect(screen.getByText('see you at standup')).toBeInTheDocument();
		expect(screen.queryByText('Failed')).not.toBeInTheDocument();
	});

	it('shows the decrypted text of an encrypted message', async () => {
		render(row({ msg: '', t: 'e2e', content: { algorithm: 'rc.v2.aes-sha2', kid: 'k1', iv: 'iv', ciphertext: 'secret' } }), {
			wrapper: appRoot(),
		});

		expect(await screen.findByText('decrypted plan')).toBeInTheDocument();
	});

	it('does not decrypt before the room key is ready, so a placeholder text is not kept as the message text', async () => {
		getState.mockReturnValue('WAITING_KEYS');
		decrypt.mockClear();
		render(row({ msg: '', t: 'e2e', content: { algorithm: 'rc.v2.aes-sha2', kid: 'k1', iv: 'iv', ciphertext: 'waiting' } }), {
			wrapper: appRoot(),
		});

		await waitFor(() => expect(getState).toHaveBeenCalled());
		expect(decrypt).not.toHaveBeenCalled();
		getState.mockReturnValue('READY');
	});

	it('offers Edit, Send now, Reschedule and Delete for a pending message', async () => {
		render(row(), { wrapper: appRoot() });

		expect(await openOptions()).toEqual(['Edit', 'Send now', 'Reschedule', 'Delete']);
	});

	it('offers no action while the message is being sent', () => {
		render(row({ status: 'sending' }), { wrapper: appRoot() });

		expect(screen.getByRole('button', { name: 'Options' })).toBeDisabled();
	});

	it('marks a failed message and keeps Send now when a retry can fix it', async () => {
		render(row({ status: 'failed', error: 'You_have_been_muted' }), { wrapper: appRoot() });

		expect(screen.getByText('Failed')).toBeInTheDocument();
		expect(screen.getByText('You_have_been_muted')).toBeInTheDocument();
		expect(await openOptions()).toEqual(['Edit', 'Retry now', 'Reschedule', 'Delete']);
	});

	it.each(['room_is_archived', 'room_is_blocked', 'error-invalid-room', 'error-invalid-user', 'error-message-size-exceeded'])(
		'drops Send now when a retry cannot succeed (%s)',
		async (error) => {
			render(row({ status: 'failed', error }), { wrapper: appRoot() });

			expect(await openOptions()).toEqual(['Copy text', 'Delete']);
		},
	);

	it('shows each file that will go with the message, with a preview for images', async () => {
		const onEdit = jest.fn();
		render(
			row(
				{
					msg: '',
					files: [
						{ _id: 'f1', name: 'a.png', type: 'image/png' },
						{ _id: 'f2', name: 'b.pdf', type: 'application/pdf' },
					],
				},
				{ onEdit },
			),
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
		render(row({ status: 'failed', error: 'error-scheduled-message-interrupted' }), { wrapper: appRoot() });

		expect(await openOptions()).toEqual(['Edit', 'Send anyway', 'Reschedule', 'Delete']);
	});
});
