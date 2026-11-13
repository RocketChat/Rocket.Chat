import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { MessageListPosition } from '@rocket.chat/ui-message-list';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useRoomMessageListData } from './useRoomMessageListData';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';
import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';
import { RoomManager } from '../../../../lib/RoomManager';
import { Messages } from '../../../../stores';
import { RoomContext, RoomSubscriptionContext } from '../../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../../hooks/useFirstUnreadMessageId';

jest.mock('../../../../lib/SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('./useRoomJumpTarget', () => ({ useRoomJumpTarget: () => ({ targetMessageId: undefined, onTargetMessageReached: jest.fn() }) }));
jest.mock('../../hooks/useFirstUnreadMessageId', () => ({ useFirstUnreadMessageId: jest.fn() }));

const rid = 'room-id';
const room = createFakeRoom({ _id: rid, t: 'c' });
const roomContext = { rid, room, subscribed: true };
const position: MessageListPosition = {
	isAtBottom: false,
	anchorMessageId: 'old',
	offsetWithinAnchor: 8,
	cacheKeys: { first: 'old', last: 'old', length: 1 },
	width: 600,
};

const lastSeen = new Date('2026-01-01T12:00:00Z');
const before = new Date('2026-01-01T10:00:00Z');
const after = new Date('2026-01-01T13:00:00Z');
const author = { _id: 'other', username: 'other' };
const message = (_id: string, ts: Date, overrides: Partial<IMessage> = {}) => createFakeMessage({ _id, rid, ts, u: author, ...overrides });

let subscription: ISubscription | undefined;

const wrapper = mockAppRoot()
	.withJohnDoe()
	.withSetting('Message_GroupingPeriod', 120)
	.withUserPreference('showThreadsInMainChannel', true)
	.wrap((children: ReactNode) => (
		<RoomContext.Provider value={roomContext}>
			<RoomSubscriptionContext.Provider value={subscription}>{children}</RoomSubscriptionContext.Provider>
		</RoomContext.Provider>
	))
	.build();

const renderData = () => renderHook(() => useRoomMessageListData(rid), { wrapper });

beforeEach(() => {
	jest.mocked(useFirstUnreadMessageId).mockReturnValue(undefined);
	subscription = createFakeSubscription({ rid, ls: lastSeen });
	Messages.state.replaceAll([message('read', before)]);
	RoomHistoryManager.close(rid);
	RoomManager.back(rid);
	RoomManager.close(rid);
	RoomManager.open(rid);
});

afterEach(() => {
	jest.restoreAllMocks();
	Messages.state.replaceAll([]);
});

describe('the position the list opens at', () => {
	it('gives no position to a room that was never left (R10)', () => {
		expect(renderData().result.current.restoredPosition).toBeUndefined();
	});

	it('gives the position the room store saved when nothing is unread (R11)', () => {
		RoomManager.getStore(rid)?.savePosition(position);

		expect(renderData().result.current.restoredPosition).toBe(position);
	});

	it.each([
		['the first unread message is known', () => jest.mocked(useFirstUnreadMessageId).mockReturnValue('unread')],
		['a message of someone else, newer than the last seen, is listed', () => Messages.state.store(message('unseen', after))],
		[
			'a thread reply that shows in the room is newer than the last seen',
			() => Messages.state.store(message('shown', after, { tmid: 'main', tshow: true })),
		],
	])('withholds the saved position while %s (R12)', (_, makeUnread) => {
		RoomManager.getStore(rid)?.savePosition(position);
		makeUnread();

		expect(renderData().result.current.restoredPosition).toBeUndefined();
	});

	it.each([
		['a thread reply that does not show in the room', () => Messages.state.store(message('reply', after, { tmid: 'main' }))],
		["the viewer's own message", () => Messages.state.store(message('mine', after, { u: { _id: 'john.doe', username: 'john.doe' } }))],
		['a message the viewer already saw', () => Messages.state.store(message('seen', before))],
	])('keeps the saved position when the only newer message is %s (R13)', (_, listMessage) => {
		RoomManager.getStore(rid)?.savePosition(position);
		listMessage();

		expect(renderData().result.current.restoredPosition).toBe(position);
	});

	it('decides about unread from the messages and the first unread id it has when it renders, not at mount (R14)', () => {
		RoomManager.getStore(rid)?.savePosition(position);
		const { result, rerender } = renderData();
		expect(result.current.restoredPosition).toBe(position);

		act(() => Messages.state.store(message('unseen', after)));
		rerender();
		expect(result.current.restoredPosition).toBeUndefined();

		act(() => Messages.state.replaceAll([message('read', before)]));
		rerender();
		expect(result.current.restoredPosition).toBe(position);

		jest.mocked(useFirstUnreadMessageId).mockReturnValue('late-first-unread');
		rerender();
		expect(result.current.restoredPosition).toBeUndefined();
	});

	it("saves the position the list reports in the room's store (R16)", () => {
		RoomManager.back(rid);
		RoomManager.close(rid);
		const { result } = renderData();
		RoomManager.open(rid);

		result.current.onPositionChange(position);

		expect(RoomManager.getStore(rid)?.position).toBe(position);
	});
});

describe('the history', () => {
	it('loads older pages with getMore and newer pages with getMoreNext (R39)', async () => {
		const getMore = jest.spyOn(RoomHistoryManager, 'getMore').mockResolvedValue(undefined);
		const getMoreNext = jest.spyOn(RoomHistoryManager, 'getMoreNext').mockResolvedValue(undefined);
		const { result } = renderData();

		await act(() => result.current.onLoadOlderMessages());
		expect(getMore).toHaveBeenCalledWith(rid);
		expect(getMoreNext).not.toHaveBeenCalled();

		await act(() => result.current.onLoadNewerMessages());
		expect(getMoreNext).toHaveBeenCalledWith(rid);
	});

	it('starts no page while the history manager loads one the room asked for in the same moment (R39)', async () => {
		const getMore = jest.spyOn(RoomHistoryManager, 'getMore').mockResolvedValue(undefined);
		const getMoreNext = jest.spyOn(RoomHistoryManager, 'getMoreNext').mockResolvedValue(undefined);
		const { result } = renderData();
		const { onLoadOlderMessages, onLoadNewerMessages } = result.current;
		RoomHistoryManager.updateRoom(rid, { isLoading: true });

		await act(async () => {
			await onLoadOlderMessages();
			await onLoadNewerMessages();
		});

		expect(getMore).not.toHaveBeenCalled();
		expect(getMoreNext).not.toHaveBeenCalled();
	});

	it('says there are older and newer messages as the history manager does (R40)', () => {
		RoomHistoryManager.updateRoom(rid, { hasMore: true, hasMoreNext: false });
		const { result } = renderData();
		expect(result.current).toMatchObject({ hasOlderMessages: true, hasNewerMessages: false });

		act(() => RoomHistoryManager.updateRoom(rid, { hasMore: false, hasMoreNext: true }));

		expect(result.current).toMatchObject({ hasOlderMessages: false, hasNewerMessages: true });
	});

	it("counts every load but the list's newer page as initial or older (R41)", async () => {
		const { result } = renderData();
		expect(result.current).toMatchObject({ isLoadingInitialMessages: false, isLoadingOlderMessages: false, isLoadingNewerMessages: false });

		act(() => RoomHistoryManager.updateRoom(rid, { isLoading: true, loaded: undefined }));
		expect(result.current).toMatchObject({ isLoadingInitialMessages: true, isLoadingOlderMessages: true, isLoadingNewerMessages: false });

		act(() => RoomHistoryManager.updateRoom(rid, { isLoading: false, loaded: 10 }));
		let settle: () => void = () => undefined;
		jest.spyOn(RoomHistoryManager, 'getMoreNext').mockReturnValue(
			new Promise((resolve) => {
				settle = () => resolve();
			}),
		);
		let loading: Promise<unknown> = Promise.resolve();
		act(() => {
			loading = result.current.onLoadNewerMessages() as Promise<unknown>;
			RoomHistoryManager.updateRoom(rid, { isLoading: true });
		});
		expect(result.current).toMatchObject({ isLoadingInitialMessages: false, isLoadingOlderMessages: false, isLoadingNewerMessages: true });

		await act(async () => {
			settle();
			await loading;
			RoomHistoryManager.updateRoom(rid, { isLoading: false });
		});
		expect(result.current).toMatchObject({ isLoadingOlderMessages: false, isLoadingNewerMessages: false });
	});

	it('clears the window before it loads the latest page, so a failed load leaves no newer messages (R42)', async () => {
		RoomHistoryManager.updateRoom(rid, { hasMoreNext: true, loaded: 1 });
		const failure = new Error('rooms.history failed');
		jest.spyOn(RoomHistoryManager, 'getMoreIfIsEmpty').mockRejectedValue(failure);
		const { result } = renderData();

		let jump: Promise<void> = Promise.resolve();
		act(() => {
			jump = result.current.onJumpToLatest();
		});

		expect(RoomHistoryManager.hasMoreNext(rid)).toBe(false);
		expect(Messages.state.filter((record) => record.rid === rid)).toEqual([]);
		await expect(jump).rejects.toBe(failure);
	});
});

describe('the viewer’s own messages and the arrivals', () => {
	it("counts the viewer's message as their own and a thread reply as nobody's (R43)", () => {
		const { isOwnMessage } = renderData().result.current;

		expect(isOwnMessage(message('mine', after, { u: { _id: 'john.doe', username: 'john.doe' } }))).toBe(true);
		expect(isOwnMessage(message('theirs', after))).toBe(false);
		expect(isOwnMessage(message('my-reply', after, { u: { _id: 'john.doe', username: 'john.doe' }, tmid: 'main' }))).toBe(false);
		expect(
			isOwnMessage(message('my-reply-in-room', after, { u: { _id: 'john.doe', username: 'john.doe' }, tmid: 'main', tshow: true })),
		).toBe(false);
	});

	it('counts a reply in a thread as no arrival, whoever wrote it and whether or not it shows in the room (R43)', () => {
		const { countsAsArrival } = renderData().result.current;

		expect(countsAsArrival(message('plain', after))).toBe(true);
		expect(countsAsArrival(message('reply', after, { tmid: 'main' }))).toBe(false);
		expect(countsAsArrival(message('reply-in-room', after, { tmid: 'main', tshow: true }))).toBe(false);
	});
});
