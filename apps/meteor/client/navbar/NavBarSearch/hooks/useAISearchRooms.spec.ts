import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook, waitFor } from '@testing-library/react';

import { useAISearchRooms } from './useAISearchRooms';

describe('useAISearchRooms', () => {
	it('should treat an unset filter as an empty search', () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([])
			.withEndpoint('GET', '/v1/spotlight', () => ({ users: [], rooms: [] }))
			.build();

		const { result } = renderHook(() => useAISearchRooms(undefined), { wrapper });

		expect(result.current.items).toEqual([]);
	});

	it('should deduplicate a user if they already exist in local subscriptions as a self-DM', async () => {
		const myUserName = 'rocketchat.internal.admin.test';
		const myUserId = 'user_id_456';

		const wrapper = mockAppRoot()
			.withSubscriptions([
				{
					_id: 'local_room_123',
					t: 'd',
					name: myUserName,
					uids: [myUserId],
				} as unknown as SubscriptionWithRoom,
			])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [{ _id: myUserId, username: myUserName, name: 'Rocket Chat Test' }],
				rooms: [],
			}))
			.build();

		const { result } = renderHook(() => useAISearchRooms(myUserName), { wrapper });

		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]._id).toBe('local_room_123');

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]._id).toBe('local_room_123');
		expect(result.current.items[0].name).toBe(myUserName);
	});

	it('should append users from the server if they are NOT duplicates', async () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([{ _id: 'local_room_123', t: 'd', name: 'general' } as unknown as SubscriptionWithRoom])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }],
				rooms: [],
			}))
			.build();

		const { result } = renderHook(() => useAISearchRooms('jo'), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.items).toHaveLength(2);
		});
	});

	it('should not expose remote suggestions for a previous debounced value', async () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([{ _id: 'local_room_123', t: 'c', name: 'general' } as unknown as SubscriptionWithRoom])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }],
				rooms: [],
			}))
			.build();

		const { result, rerender } = renderHook(({ filterText }) => useAISearchRooms(filterText), {
			initialProps: { filterText: '@john' },
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.items).toHaveLength(2);
		});

		rerender({ filterText: '@j' });

		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]._id).toBe('local_room_123');
	});
});
