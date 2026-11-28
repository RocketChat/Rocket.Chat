import type { IMessage, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useThreadMessagesQuery } from './useThreadMessagesQuery';
import { createFakeRoom } from '../../../../../../tests/mocks/data';

const room = createFakeRoom({ _id: 'room-id', t: 'c' });

jest.mock('../../../contexts/RoomContext', () => ({
	useRoom: () => room,
}));

const TMID = 'thread-id';
const TOTAL = 120;
const PAGE_SIZE = 50;

const createSerializedReply = (index: number): Serialized<IMessage> => {
	const ts = new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();

	return {
		_id: `reply-${index}`,
		rid: room._id,
		tmid: TMID,
		msg: `reply ${index}`,
		ts,
		_updatedAt: ts,
		u: { _id: 'user-id', username: 'user', name: 'User' },
	} as unknown as Serialized<IMessage>;
};

const allReplies = Array.from({ length: TOTAL }, (_, index) => createSerializedReply(index));

const idsOf = (messages: { _id: string }[]) => messages.map(({ _id }) => _id);

const newestPageIds = idsOf(allReplies.slice(TOTAL - PAGE_SIZE));

type GetThreadMessagesParams = { tmid: string; offset?: number; count?: number; aroundId?: string; sort?: string };

const setup = ({ serverLimit = Infinity }: { serverLimit?: number } = {}) => {
	const getThreadMessages = jest.fn(({ offset = 0, count = PAGE_SIZE, aroundId }: GetThreadMessagesParams) => {
		const effectiveCount = Math.min(count, serverLimit);

		if (aroundId) {
			const index = allReplies.findIndex(({ _id }) => _id === aroundId);
			const start = Math.max(0, index - Math.floor(effectiveCount / 2));

			return { messages: allReplies.slice(start, start + effectiveCount), count: effectiveCount, offset: start, total: TOTAL };
		}

		const end = TOTAL - offset;
		const start = Math.max(0, end - effectiveCount);

		return { messages: allReplies.slice(start, end), count: effectiveCount, offset, total: TOTAL };
	});

	const wrapper = mockAppRoot()
		.withJohnDoe()
		.withEndpoint('GET', '/v1/chat.getThreadMessages', getThreadMessages)
		.withEndpoint('POST', '/v1/chat.readThread', () => null)
		.build();

	const { result } = renderHook(() => useThreadMessagesQuery(TMID), { wrapper });

	return { result, getThreadMessages };
};

const waitForLoaded = async (result: { current: ReturnType<typeof useThreadMessagesQuery> }) =>
	waitFor(() => expect(result.current.isLoading).toBe(false));

describe('useThreadMessagesQuery', () => {
	it('reports no unloaded newer messages after the initial load', async () => {
		const { result } = setup();

		await waitForLoaded(result);

		expect(result.current.hasNextPage).toBe(false);
		expect(result.current.hasPreviousPage).toBe(true);
		expect(idsOf(result.current.data?.messages ?? [])).toEqual(newestPageIds);
	});

	it('reports unloaded newer messages after jumping to an old reply', async () => {
		const { result } = setup();

		await waitForLoaded(result);

		await act(async () => {
			await result.current.loadMessageAround('reply-10');
		});

		await waitFor(() => expect(result.current.hasNextPage).toBe(true));
		expect(idsOf(result.current.data?.messages ?? [])).toEqual(idsOf(allReplies.slice(0, PAGE_SIZE)));
	});

	describe('jumpToRecent', () => {
		it('refetches from the newest page and clears the unloaded-newer-messages flag', async () => {
			const { result, getThreadMessages } = setup();

			await waitForLoaded(result);

			await act(async () => {
				await result.current.loadMessageAround('reply-10');
			});
			await waitFor(() => expect(result.current.hasNextPage).toBe(true));

			getThreadMessages.mockClear();

			await act(async () => {
				await result.current.jumpToRecent();
			});

			await waitFor(() => expect(result.current.hasNextPage).toBe(false));
			expect(getThreadMessages).toHaveBeenCalledWith(expect.objectContaining({ tmid: TMID, offset: 0 }));
		});

		it('discards the detached window instead of merging it into the newest page', async () => {
			const { result } = setup();

			await waitForLoaded(result);

			await act(async () => {
				await result.current.loadMessageAround('reply-10');
			});
			await waitFor(() => expect(result.current.hasNextPage).toBe(true));

			await act(async () => {
				await result.current.jumpToRecent();
			});

			await waitFor(() => expect(result.current.hasNextPage).toBe(false));
			expect(idsOf(result.current.data?.messages ?? [])).toEqual(newestPageIds);
		});
	});

	describe('when the server clamps the response size (e.g. "Max Record Amount")', () => {
		const SERVER_LIMIT = 20;
		const AROUND_INDEX = 60;

		it('does not skip a batch of messages when loading the next page after jumping to an old reply', async () => {
			const { result } = setup({ serverLimit: SERVER_LIMIT });

			await waitForLoaded(result);

			await act(async () => {
				await result.current.loadMessageAround(`reply-${AROUND_INDEX}`);
			});
			await waitFor(() => expect(result.current.hasNextPage).toBe(true));

			const idsBeforeNextPage = idsOf(result.current.data?.messages ?? []);
			const oldestLoadedIndex = allReplies.findIndex(({ _id }) => _id === idsBeforeNextPage[0]);
			const newestLoadedIndex = allReplies.findIndex(({ _id }) => _id === idsBeforeNextPage[idsBeforeNextPage.length - 1]);

			await act(async () => {
				await result.current.fetchNextPage();
			});
			await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));

			// The newly-loaded batch must continue immediately after the previously loaded one, with no gap.
			const idsAfterNextPage = idsOf(result.current.data?.messages ?? []);
			expect(idsAfterNextPage).toEqual(idsOf(allReplies.slice(oldestLoadedIndex, newestLoadedIndex + 1 + SERVER_LIMIT)));
		});

		it('reaches the newest message without gaps after repeatedly loading next pages', async () => {
			const { result } = setup({ serverLimit: SERVER_LIMIT });

			await waitForLoaded(result);

			await act(async () => {
				await result.current.loadMessageAround(`reply-${AROUND_INDEX}`);
			});
			await waitFor(() => expect(result.current.hasNextPage).toBe(true));

			const oldestLoadedIndex = allReplies.findIndex(({ _id }) => _id === (result.current.data?.messages ?? [])[0]._id);

			while (result.current.hasNextPage) {
				await act(async () => {
					await result.current.fetchNextPage();
				});
				await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false));
			}

			expect(idsOf(result.current.data?.messages ?? [])).toEqual(idsOf(allReplies.slice(oldestLoadedIndex)));
		});
	});
});
