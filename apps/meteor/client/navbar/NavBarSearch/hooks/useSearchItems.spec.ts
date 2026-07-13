import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { getSelectedRooms } from './searchItems';
import { useSearchItems } from './useSearchItems';
import { createFakeSubscription } from '../../../../tests/mocks/data';

describe('useSearchItems', () => {
	it('matches selected rooms by name or display name without duplicating lookups', () => {
		const rooms = [
			{ _id: 'room-1', name: 'general', fname: 'General' },
			{ _id: 'room-2', name: 'engineering', fname: 'Engineering Team' },
		];

		expect(getSelectedRooms(['GENERAL', 'engineering team', 'missing'], rooms)).toEqual([rooms[0], rooms[1]]);
	});

	it('should deduplicate a user if they already exist in local subscriptions as a self-DM', async () => {
		const myUserName = 'rocketchat.internal.admin.test';
		const myUserId = 'user_id_456';

		const wrapper = mockAppRoot()
			.withSubscriptions([
				createFakeSubscription({
					_id: 'local_room_123',
					rid: 'local_room_123',
					t: 'd',
					name: myUserName,
					uids: [myUserId],
				}),
			])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [{ _id: myUserId, username: myUserName, name: 'Rocket Chat Test' }],
				rooms: [],
			}))
			.build();

		const { result } = renderHook(() => useSearchItems(myUserName), { wrapper });

		expect(result.current.data.rooms).toHaveLength(1);
		expect(result.current.data.rooms[0]._id).toBe('local_room_123');

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data.rooms).toHaveLength(1);
		expect(result.current.data.rooms[0]._id).toBe('local_room_123');
		expect(result.current.data.rooms[0].name).toBe(myUserName);
	});

	it('should append users from the server if they are NOT duplicates', async () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([createFakeSubscription({ _id: 'local_room_123', rid: 'local_room_123', t: 'd', name: 'general' })])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }],
				rooms: [],
			}))
			.build();

		const { result } = renderHook(() => useSearchItems('jo'), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.data.rooms).toHaveLength(2);
		});
	});
});
