import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useUnbanUser } from './useUnbanUser';
import { createFakeRoom } from '../../../../tests/mocks/data';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomName: () => 'general',
	},
}));

const fakeRoom = createFakeRoom({ t: 'c', name: 'general' });

const appRoot = () =>
	mockAppRoot()
		.withRoom(fakeRoom)
		.withEndpoint('POST', '/v1/rooms.unbanUser', () => null)
		.withTranslations('en', 'core', {
			Are_you_sure: 'Are you sure?',
			Yes_unban_user: 'Yes, unban user',
			The_user_will_be_unbanned_from__roomName__: 'The user will be unbanned from {{roomName}}',
		});

describe('useUnbanUser', () => {
	it('should return a function', () => {
		const { result } = renderHook(() => useUnbanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		expect(result.current).toEqual(expect.any(Function));
	});

	it('should open a confirmation modal when called', () => {
		const { result } = renderHook(() => useUnbanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		act(() => result.current('testuser'));

		expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Yes, unban user' })).toBeInTheDocument();
	});

	it('should call the unban endpoint when confirmed', async () => {
		const unbanEndpoint = jest.fn(() => null);

		const { result } = renderHook(() => useUnbanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().withEndpoint('POST', '/v1/rooms.unbanUser', unbanEndpoint).build(),
		});

		act(() => result.current('testuser'));

		await userEvent.click(screen.getByRole('button', { name: 'Yes, unban user' }));

		await waitFor(() => expect(unbanEndpoint).toHaveBeenCalledWith({ roomId: fakeRoom._id, username: 'testuser' }));
	});

	it('should close the modal after mutation settles', async () => {
		const { result } = renderHook(() => useUnbanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		act(() => result.current('testuser'));
		expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Yes, unban user' }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Are you sure?' })).not.toBeInTheDocument());
	});

	it('should close the modal when cancel is clicked', async () => {
		const { result } = renderHook(() => useUnbanUser({ roomId: fakeRoom._id }), {
			wrapper: appRoot().build(),
		});

		act(() => result.current('testuser'));
		expect(screen.getByRole('dialog', { name: 'Are you sure?' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Are you sure?' })).not.toBeInTheDocument());
	});

	it('should throw if room is not found', () => {
		expect(() =>
			renderHook(() => useUnbanUser({ roomId: 'nonexistent' }), {
				wrapper: appRoot()
					.withRoom(undefined as unknown as IRoom)
					.build(),
			}),
		).toThrow('error-invalid-room');
	});
});
