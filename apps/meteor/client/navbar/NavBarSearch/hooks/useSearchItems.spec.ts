import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook, waitFor } from '@testing-library/react';

import { useSearchItems } from './useSearchItems';

describe('useSearchItems', () => {
	it('should treat an unset filter as an empty search', () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([])
			.withEndpoint('GET', '/v1/spotlight', () => ({ users: [], rooms: [] }))
			.build();

		const { result } = renderHook(() => useSearchItems(undefined), { wrapper });

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

		const { result } = renderHook(() => useSearchItems(myUserName), { wrapper });

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

		const { result } = renderHook(() => useSearchItems('jo'), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.items).toHaveLength(2);
		});
	});

	it('should hoist exact name match from local subscriptions to the top', () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([
				{
					_id: 'room_1',
					t: 'c',
					name: 'marketing-team-ideas',
					lm: new Date('2026-01-02'),
				} as unknown as SubscriptionWithRoom,
				{
					_id: 'room_2',
					t: 'c',
					name: 'marketing-team',
					lm: new Date('2026-01-01'),
				} as unknown as SubscriptionWithRoom,
			])
			.withEndpoint('GET', '/v1/spotlight', () => ({ users: [], rooms: [] }))
			.build();

		const { result } = renderHook(() => useSearchItems('marketing-team'), { wrapper });

		expect(result.current.items).toHaveLength(2);
		expect(result.current.items[0]._id).toBe('room_2');
		expect(result.current.items[0].name).toBe('marketing-team');
		expect(result.current.items[1]._id).toBe('room_1');
	});

	it('should hoist exact name match case-insensitively', () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([
				{
					_id: 'room_1',
					t: 'c',
					name: 'marketing-team-ideas',
				} as unknown as SubscriptionWithRoom,
				{
					_id: 'room_2',
					t: 'c',
					name: 'marketing-team',
				} as unknown as SubscriptionWithRoom,
			])
			.withEndpoint('GET', '/v1/spotlight', () => ({ users: [], rooms: [] }))
			.build();

		const { result } = renderHook(() => useSearchItems('Marketing-Team'), { wrapper });

		expect(result.current.items).toHaveLength(2);
		expect(result.current.items[0]._id).toBe('room_2');
		expect(result.current.items[0].name).toBe('marketing-team');
	});

	it('should hoist exact match from server ahead of local partial matches', async () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([
				{
					_id: 'room_1',
					t: 'c',
					name: 'marketing-team-ideas',
				} as unknown as SubscriptionWithRoom,
			])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [],
				rooms: [{ _id: 'room_server', t: 'c', name: 'marketing-team' }],
			}))
			.build();

		const { result } = renderHook(() => useSearchItems('marketing-team'), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.items).toHaveLength(2);
			expect(result.current.items[0]._id).toBe('room_server');
			expect(result.current.items[0].name).toBe('marketing-team');
		});
	});

	it('should fetch and hoist exact match from server even when local subscriptions reach LIMIT', async () => {
		const localSubscriptions = Array.from({ length: 20 }, (_, i) => ({
			_id: `local_room_${i}`,
			t: 'c',
			name: `marketing-team-ideas${i}`,
		})) as unknown as SubscriptionWithRoom[];

		const wrapper = mockAppRoot()
			.withSubscriptions(localSubscriptions)
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [],
				rooms: [{ _id: 'room_server_exact', t: 'c', name: 'marketing-team' }],
			}))
			.build();

		const { result } = renderHook(() => useSearchItems('marketing-team'), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.items[0]._id).toBe('room_server_exact');
			expect(result.current.items[0].name).toBe('marketing-team');
		});
	});
});
