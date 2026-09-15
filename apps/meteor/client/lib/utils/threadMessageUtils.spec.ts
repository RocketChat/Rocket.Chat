import type { IThreadMessage } from '@rocket.chat/core-typings';
import { QueryClient } from '@tanstack/react-query';

import { mutateThreadMessagesInfiniteData, upsertThreadMessageInCache, type ThreadMessagesInfiniteData } from './threadMessageUtils';

const rid = 'room1';
const tmid = 'thread1';
const queryKey = ['rooms', rid, 'threads', tmid, 'messages'] as const;

const createMessage = (id: string, ts: number): IThreadMessage =>
	({
		_id: id,
		rid,
		tmid,
		msg: id,
		ts: new Date(ts).toISOString() as any,
		u: { _id: 'user1', username: 'user1' },
		_updatedAt: new Date(ts).toISOString() as any,
	}) as IThreadMessage;

// A thread with 200 replies, one cached page holding reply-075..reply-124.
const createAnchoredCache = (): ThreadMessagesInfiniteData => ({
	pages: [
		{
			items: Array.from({ length: 50 }, (_, i) => createMessage(`reply-${String(i + 75).padStart(3, '0')}`, i + 75)),
			itemCount: 200,
		},
	],
	pageParams: [75],
});

describe('mutateThreadMessagesInfiniteData', () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient();
	});

	it('shifts every stored pageParam forward when a message newer than everything cached is inserted', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			messages.push(createMessage('reply-200', 1000));
			messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].itemCount).toBe(201);
		expect(data?.pages[0].items.map((m) => m._id)).toContain('reply-200');
		expect(data?.pageParams).toEqual([76]);
	});

	it('keeps a pageParam of 0 unshifted when a newer message is inserted and user is at the newest message', () => {
		const cache: ThreadMessagesInfiniteData = {
			pages: [{ items: [createMessage('reply-150', 150), createMessage('reply-199', 199)], itemCount: 200 }],
			pageParams: [0],
		};
		queryClient.setQueryData(queryKey, cache);

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			messages.push(createMessage('reply-200', 1000));
			messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].itemCount).toBe(201);
		expect(data?.pages[0].items.map((m) => m._id)).toContain('reply-200');
		expect(data?.pageParams).toEqual([0]);
	});

	it('shifts pageParams when the inserted message ties the newest cached timestamp', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			messages.push(createMessage('reply-200', 124));
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].itemCount).toBe(201);
		expect(data?.pageParams).toEqual([76]);
	});

	it('shifts every page pageParam, not just the last one, when a newer message arrives', () => {
		const cache: ThreadMessagesInfiniteData = {
			pages: [
				{ items: [createMessage('reply-025', 25), createMessage('reply-026', 26)], itemCount: 200 },
				{ items: [createMessage('reply-075', 75), createMessage('reply-076', 76)], itemCount: 200 },
			],
			pageParams: [25, 75],
		};
		queryClient.setQueryData(queryKey, cache);

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			messages.push(createMessage('reply-200', 1000));
			messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pageParams).toEqual([26, 76]);
	});

	it('does not shift pageParams when the inserted message is older than what is already cached', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			messages.unshift(createMessage('reply-010', 10));
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].itemCount).toBe(201);
		expect(data?.pageParams).toEqual([75]);
	});

	it('does not shift pageParams when a cached message is deleted', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			const index = messages.findIndex((m) => m._id === 'reply-100');
			messages.splice(index, 1);
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].items.map((m) => m._id)).not.toContain('reply-100');
		expect(data?.pages[0].itemCount).toBe(199);
		expect(data?.pageParams).toEqual([75]);
	});

	it('does not shift pageParams when an existing message is edited in place', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			const index = messages.findIndex((m) => m._id === 'reply-100');
			messages[index] = { ...messages[index], msg: 'edited' };
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].itemCount).toBe(200);
		expect(data?.pageParams).toEqual([75]);
	});

	it('removes a message from every cached page when its id was duplicated across pages, not just the first occurrence', () => {
		const cache: ThreadMessagesInfiniteData = {
			pages: [
				{ items: [createMessage('reply-058', 58), createMessage('reply-059', 59), createMessage('reply-060', 60)], itemCount: 200 },
				{ items: [createMessage('reply-060', 60), createMessage('reply-061', 61)], itemCount: 200 },
			],
			pageParams: [58, 60],
		};
		queryClient.setQueryData(queryKey, cache);

		mutateThreadMessagesInfiniteData(queryClient, queryKey, (messages) => {
			const index = messages.findIndex((m) => m._id === 'reply-060');
			messages.splice(index, 1);
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);
		const allIds = data?.pages.flatMap((page) => page.items.map((m) => m._id)) ?? [];

		expect(allIds).not.toContain('reply-060');
		expect(data?.pages[0].itemCount).toBe(199);
	});

	it('collapses a duplicated id into a single entry, keeping the most recently updated copy, even when the mutation is a no-op', () => {
		const stale = createMessage('reply-060', 60);
		const fresh: IThreadMessage = { ...createMessage('reply-060', 60), msg: 'edited', _updatedAt: new Date(9999).toISOString() as any };
		const cache: ThreadMessagesInfiniteData = {
			pages: [
				{ items: [stale], itemCount: 200 },
				{ items: [fresh], itemCount: 200 },
			],
			pageParams: [60, 60],
		};
		queryClient.setQueryData(queryKey, cache);

		mutateThreadMessagesInfiniteData(queryClient, queryKey, () => {
			// no-op mutation: only the dedup pass should change the cache
		});

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);
		const allItems = data?.pages.flatMap((page) => page.items) ?? [];

		expect(allItems).toHaveLength(1);
		expect(allItems[0].msg).toBe('edited');
	});
});

describe('upsertThreadMessageInCache', () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient();
	});

	it('seeds the cache with pageParams [0] when nothing was cached yet', () => {
		upsertThreadMessageInCache(createMessage('reply-000', 0), rid, tmid, queryClient);

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);

		expect(data?.pages[0].itemCount).toBe(1);
		expect(data?.pageParams).toEqual([0]);
	});

	it('keeps the next-page fetch offset aligned with the real data after a live reply arrives, so no message is skipped', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		upsertThreadMessageInCache(createMessage('reply-200', 1000), rid, tmid, queryClient);

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);
		const [pageParam] = data?.pageParams ?? [];

		expect(data?.pages[0].itemCount).toBe(201);
		// useThreadMessagesQuery's getNextPageParam computes offset = pageParam - count (50),
		// so 76 (not the stale 75) produces offset 26, which includes reply-125.
		expect(pageParam).toBe(76);
	});

	it('updates an existing message in place without shifting pageParams', () => {
		queryClient.setQueryData(queryKey, createAnchoredCache());

		const edited = { ...createMessage('reply-100', 100), msg: 'edited' };
		upsertThreadMessageInCache(edited, rid, tmid, queryClient);

		const data = queryClient.getQueryData<ThreadMessagesInfiniteData>(queryKey);
		const updated = data?.pages[0].items.find((m) => m._id === 'reply-100');

		expect(updated?.msg).toBe('edited');
		expect(data?.pages[0].itemCount).toBe(200);
		expect(data?.pageParams).toEqual([75]);
	});
});
