import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ModalContext } from '@rocket.chat/ui-contexts';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';

import { useRemoveUserAction } from './useRemoveUserAction';
import { createFakeRoom, createFakeUser } from '../../../../../../tests/mocks/data';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';

jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { getRoomName: () => 'general', getRoomDirectives: () => ({ allowMemberAction: () => true }) },
}));

describe('useRemoveUserAction', () => {
	it('should refresh every members list of the room after an invitation is revoked', async () => {
		const queryClient = new QueryClient();
		const filteredList = roomsQueryKeys.members('room-id', 'c', 'all', 'john');
		const otherRoomList = roomsQueryKeys.members('other-room-id', 'c', 'all', 'john');
		queryClient.setQueryData(filteredList, { pages: [] });
		queryClient.setQueryData(otherRoomList, { pages: [] });
		const setModal = jest.fn();

		const { result } = renderHook(() => useRemoveUserAction(createFakeUser({ _id: 'invited-id' }), 'room-id', undefined, true), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRoom(createFakeRoom({ _id: 'room-id', t: 'c' }))
				.withPermission('remove-user')
				.withEndpoint('POST', '/v1/channels.kick', () => ({
					channel: {
						_id: 'room-id',
						_updatedAt: new Date().toISOString(),
						t: 'c' as const,
						msgs: 0,
						usersCount: 1,
						u: { _id: 'owner-id', username: 'owner' },
					},
				}))
				.withQueryClient(queryClient)
				.wrap((children) => (
					<ModalContext.Provider value={{ modal: { setModal }, currentModal: { component: null } }}>{children}</ModalContext.Provider>
				))
				.build(),
		});

		act(() => result.current?.onClick?.());
		const confirmation: ReactElement<{ onConfirm: () => Promise<void> }> = setModal.mock.calls[0][0];
		await act(() => confirmation.props.onConfirm());

		expect(queryClient.getQueryState(filteredList)?.isInvalidated).toBe(true);
		expect(queryClient.getQueryState(otherRoomList)?.isInvalidated).toBe(false);
	});
});
