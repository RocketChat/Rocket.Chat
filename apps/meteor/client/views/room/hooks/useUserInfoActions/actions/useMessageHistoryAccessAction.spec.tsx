import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useMessageHistoryAccessAction } from './useMessageHistoryAccessAction';
import { createFakeRoom, createFakeUser } from '../../../../../../tests/mocks/data';

describe('useMessageHistoryAccessAction', () => {
	const member = createFakeUser({ _id: 'member-id', username: 'member' });
	const room = createFakeRoom({ _id: 'room-id', t: 'c' });

	const appRoot = () =>
		mockAppRoot()
			.withJohnDoe()
			.withRoom(room)
			.withSetting('Restricted_Message_History_Enabled', true)
			.withPermission('add-user-to-joined-room');

	it('is not offered while the feature is off', () => {
		const { result } = renderHook(() => useMessageHistoryAccessAction(member, room._id, null), {
			wrapper: mockAppRoot().withJohnDoe().withRoom(room).withPermission('add-user-to-joined-room').build(),
		});

		expect(result.current).toBeUndefined();
	});

	it('is not offered without permission to add members', () => {
		const { result } = renderHook(() => useMessageHistoryAccessAction(member, room._id, null), {
			wrapper: mockAppRoot().withJohnDoe().withRoom(room).withSetting('Restricted_Message_History_Enabled', true).build(),
		});

		expect(result.current).toBeUndefined();
	});

	it('is not offered when the member state is unknown', () => {
		const { result } = renderHook(() => useMessageHistoryAccessAction(member, room._id, undefined), { wrapper: appRoot().build() });

		expect(result.current).toBeUndefined();
	});

	it('offers to hide the history of a member who sees all of it', () => {
		const { result } = renderHook(() => useMessageHistoryAccessAction(member, room._id, null), { wrapper: appRoot().build() });

		expect(result.current).toMatchObject({ content: 'Hide_earlier_messages', icon: 'eye-off' });
	});

	it('restores the history of a restricted member without asking', async () => {
		const setMemberHistoryAccess = jest.fn().mockResolvedValue({ success: true });

		const { result } = renderHook(() => useMessageHistoryAccessAction(member, room._id, '2026-10-01T00:00:00.000Z'), {
			wrapper: appRoot().withEndpoint('POST', '/v1/rooms.setMemberHistoryAccess', setMemberHistoryAccess).build(),
		});

		expect(result.current).toMatchObject({ content: 'Show_earlier_messages', icon: 'eye' });

		act(() => {
			void result.current?.onClick?.();
		});

		await waitFor(() => expect(setMemberHistoryAccess).toHaveBeenCalledWith({ roomId: room._id, userId: member._id, restricted: false }));
	});
});
