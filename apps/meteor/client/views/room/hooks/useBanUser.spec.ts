import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useBanUser } from './useBanUser';
import { createFakeRoom } from '../../../../tests/mocks/data';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomName: () => 'test-room',
	},
}));

const fakeRoom = createFakeRoom({ t: 'c', name: 'test-room' });

const appRoot = (room: IRoom | undefined = fakeRoom) =>
	mockAppRoot()
		.withRoom(room)
		.withEndpoint('POST', '/v1/rooms.banUser', () => null)
		.withTranslations('en', 'core', {
			Are_you_sure: 'Are you sure?',
			Yes_ban_user: 'Yes, ban user',
			The_user_will_be_banned_from__roomName__: 'The user will be banned from {{roomName}}',
		});

describe('useBanUser', () => {
	it('should return a function', () => {
		const { result } = renderHook(() => useBanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		expect(result.current).toEqual(expect.any(Function));
	});

	it('should open a confirmation modal when called', () => {
		const { result } = renderHook(() => useBanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		act(() => result.current('testuser'));

		expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Yes, ban user' })).toBeInTheDocument();
	});

	it('should call the ban endpoint when confirmed', async () => {
		const banEndpoint = jest.fn(() => null);

		const { result } = renderHook(() => useBanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().withEndpoint('POST', '/v1/rooms.banUser', banEndpoint).build(),
		});

		act(() => result.current('testuser'));

		await userEvent.click(screen.getByRole('button', { name: 'Yes, ban user' }));

		await waitFor(() => expect(banEndpoint).toHaveBeenCalledWith({ roomId: fakeRoom._id, username: 'testuser' }));
	});

	it('should close the modal after mutation settles', async () => {
		const { result } = renderHook(() => useBanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		act(() => result.current('testuser'));
		expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Yes, ban user' }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Are you sure?' })).not.toBeInTheDocument());
	});

	it('should close the modal when cancel is clicked', async () => {
		const { result } = renderHook(() => useBanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		act(() => result.current('testuser'));
		expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Are you sure?' })).not.toBeInTheDocument());
	});

	it('should throw if room is not found', () => {
		expect(() =>
			renderHook(() => useBanUser({ roomId: 'nonexistent' }), {
				wrapper: appRoot(undefined)
					.withRoom(undefined as unknown as IRoom)
					.build(),
			}),
		).toThrow('error-invalid-room');
	});
});
