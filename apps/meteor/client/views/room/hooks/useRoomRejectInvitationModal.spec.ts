import { faker } from '@faker-js/faker/locale/af_ZA';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useRoomRejectInvitationModal } from './useRoomRejectInvitationModal';
import { createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';

const roomName = faker.lorem.word();
const inviterUsername = `testusername`;

const mockedRoom = createFakeRoom({ t: 'c', name: roomName });
const mockedSubscription = createFakeSubscription({
	t: 'c',
	rid: mockedRoom._id,
	status: 'INVITED',
	inviter: { _id: 'inviterId', username: inviterUsername, name: 'Inviter Name' },
	name: mockedRoom.name,
	fname: mockedRoom.fname,
});

const appRoot = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			Reject_invitation: 'Reject invitation',
			Reject_dm_invitation_description: "You're rejecting the invitation to join {{username}} in a conversation. This cannot be undone.",
			Reject_channel_invitation_description:
				"You're rejecting the invitation from {{username}} to join {{roomName}}. This cannot be undone.",
			Cancel: 'Cancel',
			unknown: 'unknown',
		})
		.withSubscription(mockedSubscription);

describe('useRoomRejectInvitationModal', () => {
	it('should return open and close functions', () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), { wrapper: appRoot().build() });
		expect(result.current).toMatchObject({
			open: expect.any(Function),
			close: expect.any(Function),
		});
	});

	it('should open modal when open is called', async () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), { wrapper: appRoot().build() });

		act(() => void result.current.open());

		const dialog = await screen.findByRole('dialog', { name: 'Reject invitation' });

		expect(dialog).toBeInTheDocument();
	});

	it('should resolve open with true when rejected', async () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), { wrapper: appRoot().build() });

		let answer = false;
		act(() => {
			void result.current.open().then((res) => {
				answer = res;
			});
		});

		const dialog = await screen.findByRole('dialog', { name: 'Reject invitation' });

		expect(dialog).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Reject invitation' }));

		expect(answer).toBe(true);
	});

	it('should resolve open with false when cancelled', async () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), { wrapper: appRoot().build() });

		let answer = false;
		act(() => {
			void result.current.open().then((res) => {
				answer = res;
			});
		});

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(answer).toBe(false);
	});

	it('should resolve open with false when modal is closed', async () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), { wrapper: appRoot().build() });

		let answer = false;
		act(() => {
			void result.current.open().then((res) => {
				answer = res;
			});
		});

		await userEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(answer).toBe(false);
	});

	it('should close modal when close is called', () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), { wrapper: appRoot().build() });

		act(() => void result.current.open());

		expect(screen.getByRole('dialog', { name: 'Reject invitation' })).toBeInTheDocument();

		act(() => result.current.close());

		expect(screen.queryByRole('dialog', { name: 'Reject invitation' })).not.toBeInTheDocument();
	});

	it('should display the correct description for rejecting DMs', () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal({ ...mockedRoom, t: 'd' }), {
			wrapper: appRoot()
				.withSubscriptions([{ ...mockedSubscription, t: 'd' }])
				.build(),
		});

		act(() => void result.current.open());

		expect(
			screen.getByText(`You're rejecting the invitation to join @${inviterUsername} in a conversation. This cannot be undone.`),
		).toBeInTheDocument();
	});

	it('should display the correct description for rejecting channels', () => {
		const { result } = renderHook(() => useRoomRejectInvitationModal(mockedRoom), {
			wrapper: appRoot().build(),
		});

		act(() => void result.current.open());

		expect(
			screen.getByText(`You're rejecting the invitation from @${inviterUsername} to join ${roomName}. This cannot be undone.`),
		).toBeInTheDocument();
	});
});
