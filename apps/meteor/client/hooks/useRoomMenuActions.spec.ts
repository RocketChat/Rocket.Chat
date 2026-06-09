import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useRoomMenuActions } from './useRoomMenuActions';
import { useLeaveRoomAction } from './menuActions/useLeaveRoom';
import { createFakeSubscription, createFakeRoom } from '../../tests/mocks/data';

const mockSubscription = createFakeSubscription({ name: 'room1', fname: 'Room 1', t: 'c', disableNotifications: false, rid: 'room1' });
const mockRoom = createFakeRoom({ t: 'c', name: 'room1', _id: 'room1' });

jest.mock('./menuActions/useLeaveRoom', () => ({
	useLeaveRoomAction: jest.fn(),
}));

jest.mock('./menuActions/useToggleFavoriteAction', () => ({
	useToggleFavoriteAction: jest.fn(),
}));

jest.mock('./menuActions/useToggleReadAction', () => ({
	useToggleReadAction: jest.fn(),
}));

jest.mock('./useHideRoomAction', () => ({
	useHideRoomAction: jest.fn(),
}));

jest.mock('../views/omnichannel/hooks/useOmnichannelPrioritiesMenu', () => ({
	useOmnichannelPrioritiesMenu: jest.fn(() => []),
}));

const mockHookProps = {
	rid: 'room1',
	type: 'c',
	name: 'Room 1',
	isUnread: true,
	cl: true,
	roomOpen: true,
	hideDefaultOptions: false,
} as const;

describe('useRoomMenuActions', () => {
	it('should pass teamId and teamMain to useLeaveRoomAction when room has them', () => {
		const roomWithTeam = { ...mockRoom, teamId: 'team1', teamMain: true };
		
		renderHook(() => useRoomMenuActions(mockHookProps), {
			wrapper: mockAppRoot()
				.withSubscription({ ...mockSubscription, rid: 'room1' })
                .withRoom(roomWithTeam)
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		expect(useLeaveRoomAction).toHaveBeenCalledWith(expect.objectContaining({
			teamId: 'team1',
			teamMain: true,
		}));
	});

	it('should return menu options for normal rooms', () => {
		const { result } = renderHook(() => useRoomMenuActions(mockHookProps), {
			wrapper: mockAppRoot()
				.withSubscription({ ...mockSubscription, rid: 'room1' })
                .withRoom(mockRoom)
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		const sections = result.current;
        
		expect(sections).toHaveLength(1);
		expect(sections[0].items).toHaveLength(4); 
	});
});
