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

	it('should keep a user the server matched on a field other than the name', async () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([])
			.withEndpoint('GET', '/v1/spotlight', () => ({
				users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }],
				rooms: [],
			}))
			.build();

		const { result } = renderHook(() => useSearchItems('5511'), { wrapper });

		await waitFor(() => {
			expect(result.current.items).toHaveLength(1);
		});

		expect(result.current.items[0].name).toBe('john.doe');
	});

	it('should hide a match on another field until the server answers the new search', async () => {
		let answerNewSearch: () => void = () => undefined;
		const newSearch = new Promise<void>((resolve) => {
			answerNewSearch = resolve;
		});
		const newSearchRequested = jest.fn();

		const wrapper = mockAppRoot()
			.withSubscriptions([])
			.withEndpoint('GET', '/v1/spotlight', async ({ query }) => {
				if (query !== '5511') {
					newSearchRequested();
					await newSearch;
				}

				return { users: [{ _id: 'user_id_456', username: 'john.doe', name: 'John Doe' }], rooms: [] };
			})
			.build();

		const { result, rerender } = renderHook(({ filterText }) => useSearchItems(filterText), {
			initialProps: { filterText: '5511' },
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.items).toHaveLength(1);
		});

		rerender({ filterText: '55119' });

		expect(result.current.items).toEqual([]);

		await waitFor(() => expect(newSearchRequested).toHaveBeenCalled(), { timeout: 2000 });

		expect(result.current.items).toEqual([]);

		answerNewSearch();

		await waitFor(() => {
			expect(result.current.items).toHaveLength(1);
		});
	});

	it('should report loading while the new search waits for the debounce', async () => {
		const wrapper = mockAppRoot()
			.withSubscriptions([])
			.withEndpoint('GET', '/v1/spotlight', () => ({ users: [], rooms: [] }))
			.build();

		const { result, rerender } = renderHook(({ filterText }) => useSearchItems(filterText), {
			initialProps: { filterText: '5511' },
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		rerender({ filterText: '55119' });

		expect(result.current.isLoading).toBe(true);
	});
});
