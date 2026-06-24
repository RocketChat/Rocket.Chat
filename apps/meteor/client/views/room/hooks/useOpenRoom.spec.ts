import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useOpenRoom } from './useOpenRoom';
import { createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';
import { Rooms, Subscriptions } from '../../../stores';

jest.mock('../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: { open: jest.fn(), close: jest.fn() },
}));

jest.mock('../../../lib/RoomManager', () => ({
	RoomManager: { opened: null },
}));

jest.mock('./useOpenRoomMutation', () => ({
	useOpenRoomMutation: () => ({ mutateAsync: jest.fn() }),
}));

afterEach(() => {
	Subscriptions.state.replaceAll([]);
	Rooms.state.replaceAll([]);
});

describe('useOpenRoom', () => {
	describe('type-aware subscription cache lookup', () => {
		it('resolves /channel/<name> to the channel even when a DM with the same name is cached', async () => {
			const channelRid = 'channel-rid-abc';
			const dmRid = 'dm-rid-abc';
			const sharedName = 'alex';

			// Seed cache: only a DM subscription named 'alex' — no channel subscription
			Subscriptions.state.store(createFakeSubscription({ t: 'd', name: sharedName, rid: dmRid, open: true }));
			Rooms.state.store(createFakeRoom({ _id: dmRid, t: 'd' }));

			const channelRoom = createFakeRoom({ _id: channelRid, t: 'c', name: sharedName });

			const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: sharedName }), {
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withPermission('preview-c-room')
					.withMethod('getRoomByTypeAndName', () => channelRoom as any)
					.build(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data?.rid).toBe(channelRid);
		});

		it('resolves from cache when a channel subscription with a matching name and type is already cached', async () => {
			const channelRid = 'channel-rid-general';
			const channelName = 'general';

			Subscriptions.state.store(createFakeSubscription({ t: 'c', name: channelName, rid: channelRid, open: true }));
			Rooms.state.store(createFakeRoom({ _id: channelRid, t: 'c', name: channelName }));

			const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: channelName }), {
				wrapper: mockAppRoot().withJohnDoe().build(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data?.rid).toBe(channelRid);
		});

		it('resolves a DM from cache when navigating by rid', async () => {
			const dmRid = 'dm-rid-xyz';

			Subscriptions.state.store(createFakeSubscription({ t: 'd', name: 'bob', rid: dmRid, open: true }));
			Rooms.state.store(createFakeRoom({ _id: dmRid, t: 'd' }));

			const { result } = renderHook(() => useOpenRoom({ type: 'd', reference: dmRid }), {
				wrapper: mockAppRoot().withJohnDoe().build(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data?.rid).toBe(dmRid);
		});
	});
});
