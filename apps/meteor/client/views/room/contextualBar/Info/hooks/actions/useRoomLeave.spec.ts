import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useRoomLeave } from './useRoomLeave';
import { createFakeRoom, createFakeSubscription } from '../../../../../../../tests/mocks/data';

const mockRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1' });
const mockSubscription = createFakeSubscription({ name: 'room1', t: 'c', disableNotifications: false, rid: 'room1' });

jest.mock('../../../../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

jest.mock('../../../../../../../client/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

it('should return leave function if user has subscription', () => {
	const wrapper = mockAppRoot()
		.withPermission('leave-c')
		.withSubscription({ ...mockSubscription, rid: 'room1' })
		.build();

	const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
	expect(typeof result.current).toBe('function');
});

it('should return null if user does not have subscription', () => {
	const wrapper = mockAppRoot().withPermission('leave-c').build();

	const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
	expect(result.current).toBeNull();
});
