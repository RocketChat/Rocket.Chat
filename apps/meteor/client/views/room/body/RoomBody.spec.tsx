import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { RoomToolboxContext } from '@rocket.chat/ui-contexts';
import type { MessageListHandle, MessageListVisibility } from '@rocket.chat/ui-message-list';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode, Ref } from 'react';
import { useEffect, useImperativeHandle } from 'react';

import RoomBody from './RoomBody';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';
import { RoomHistoryManager } from '../../../lib/RoomHistoryManager';
import { RoomManager } from '../../../lib/RoomManager';
import { sdk } from '../../../lib/SDKClient';
import type { ChatAPI } from '../../../lib/chats/ChatAPI';
import { ReadStateManager } from '../../../lib/chats/readStateManager';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';
import { Messages } from '../../../stores';
import { ChatContext } from '../contexts/ChatContext';
import { RoomContext, RoomSubscriptionContext } from '../contexts/RoomContext';
import { selectedMessageStore } from '../providers/SelectedMessageStore';

jest.mock('../../../lib/SDKClient', () => ({ sdk: { rest: { post: jest.fn(), get: jest.fn() } } }));
jest.mock('../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../../lib/user', () => ({ getUserId: () => 'john.doe' }));
jest.mock('../../../lib/LegacyRoomManager', () => ({
	LegacyRoomManager: {
		setPropertyByRid: jest.fn(),
		listenRoomPropsByRid: () => ({ subscribe: () => () => undefined, getSnapshotValue: () => mockUnreadSince }),
	},
}));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isRouteNameKnown: () => true, isLivechatRoom: () => false } }));
jest.mock('../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));
const mockGoToRoom = jest.fn();
jest.mock('../hooks/useGoToRoom', () => ({ useGoToRoom: () => mockGoToRoom }));
jest.mock('./hooks/useGoToHomeOnRemoved', () => ({ useGoToHomeOnRemoved: () => undefined }));
jest.mock('./hooks/useReadMessageWindowEvents', () => ({ useReadMessageWindowEvents: () => undefined }));
jest.mock('./hooks/useQuoteMessageByUrl', () => ({ useQuoteMessageByUrl: () => undefined }));
jest.mock('./hooks/useFileUploadDropTarget', () => ({
	useFileUploadDropTarget: () => [{ 'data-drop-trigger': true }, { visible: false, enabled: true, onDismiss: () => undefined }],
}));
jest.mock('./hooks/useFileUpload', () => ({ useFileUpload: () => ({ uploads: mockUploads, isUploading: mockUploads.length > 0 }) }));
jest.mock('./DropTargetOverlay', () => () => <div data-testid='drop-target' />);
jest.mock('./UploadProgress', () => () => <div>Upload progress</div>);
jest.mock('../RoomAnnouncement', () => () => <div>Room announcement</div>);
jest.mock('../composer/RoomComposer/RoomComposer', () => ({ children }: { children: ReactNode }) => (
	<div data-testid='room-composer'>{children}</div>
));

let mockUnreadSince: Date | undefined;
let mockUploads: unknown[] = [];
const mockComposerProps = jest.fn();
jest.mock('../composer/ComposerContainer', () => (props: unknown) => {
	mockComposerProps(props);
	return <div data-testid='composer' />;
});

const mockListProps = jest.fn();
const mockListMounted = jest.fn();
const mockHandle = { scrollToTop: jest.fn(), scrollToBottom: jest.fn(), scrollToMessage: jest.fn(), getVisibility: jest.fn() };
jest.mock('./RoomMessageList/RoomMessageList', () => ({ ref, ...props }: { ref: Ref<MessageListHandle>; room: IRoom }) => {
	mockListProps(props);
	useImperativeHandle(ref, () => mockHandle as unknown as MessageListHandle);
	useEffect(() => mockListMounted(props.room._id), [props.room._id]);
	return <div role='list' aria-label='Message_list' />;
});

const rid = 'room-id';
const lastSeen = new Date('2026-01-01T12:00:00Z');
const author = { _id: 'other', username: 'other' };
const at = (seconds: number) => new Date(lastSeen.getTime() + seconds * 1000);
const message = (_id: string, seconds: number, overrides: Partial<IMessage> = {}) =>
	createFakeMessage({ _id, rid, ts: at(seconds), u: author, ...overrides });
const visibility = (overrides: Partial<MessageListVisibility> = {}): MessageListVisibility =>
	({ topMessage: undefined, isFirstUnreadVisible: false, isAtBottom: false, ...overrides }) as MessageListVisibility;

const toolbox = { actions: [], openTab: jest.fn(), closeTab: jest.fn() };
let chat: ChatAPI;

type Options = {
	room?: IRoom;
	subscription?: ISubscription | null;
	preferences?: Record<string, boolean>;
	router?: Parameters<ReturnType<typeof mockAppRoot>['withRouter']>[0];
	configure?: (root: ReturnType<typeof mockAppRoot>) => ReturnType<typeof mockAppRoot>;
};

const newPlace = ({ room = createFakeRoom({ _id: rid, t: 'p' }), subscription }: Options = {}) => {
	const sub =
		subscription === null ? undefined : (subscription ?? createFakeSubscription({ rid: room._id, ls: lastSeen, unread: 1, alert: true }));
	const manager = new ReadStateManager(room._id);
	if (sub) {
		manager.updateSubscription(sub);
	}
	const placeChat = { ...chat, readStateManager: manager } as unknown as ChatAPI;
	return { room, sub, chat: placeChat };
};

const renderBody = (options: Options = {}) => {
	let place = newPlace(options);
	let root = mockAppRoot().withJohnDoe().withTranslations('en', 'core', {
		unread_messages_counter_one: '{{count}} unread message',
		unread_messages_counter_other: '{{count}} unread messages',
		Mark_as_read: 'Mark as read',
	});
	if (options.router) {
		root = root.withRouter(options.router);
	}
	root = options.configure?.(root) ?? root;
	Object.entries(options.preferences ?? {}).forEach(([key, value]) => {
		root = root.withUserPreference(key, value);
	});
	const wrapper = root
		.wrap((children: ReactNode) => (
			<ChatContext.Provider value={place.chat}>
				<RoomToolboxContext.Provider value={toolbox}>
					<RoomContext.Provider value={{ rid: place.room._id, room: place.room, subscribed: !!place.sub }}>
						<RoomSubscriptionContext.Provider value={place.sub}>{children}</RoomSubscriptionContext.Provider>
					</RoomContext.Provider>
				</RoomToolboxContext.Provider>
			</ChatContext.Provider>
		))
		.build();
	const view = render(<RoomBody />, { wrapper });

	return {
		...view,
		manager: place.chat.readStateManager,
		/** Shows another room in the same body, as the app does when the viewer switches rooms. */
		switchTo: (next: Options) => {
			place = newPlace(next);
			view.rerender(<RoomBody />);
		},
	};
};

const cleanupBody = () => cleanup();
const messagesArea = () => screen.getByRole('list', { name: 'Message_list' }).closest('.messages-box') as HTMLElement;
const lastListProps = () => mockListProps.mock.lastCall?.[0];
const report = (visible: Partial<MessageListVisibility>) => act(() => lastListProps().onVisibleMessagesChange(visibility(visible)));
const settleTimers = (ms: number) => act(() => jest.advanceTimersByTime(ms));
const markedAsRead = () => jest.mocked(sdk.rest.post).mock.calls.filter(([endpoint]) => (endpoint as string) === '/v1/subscriptions.read');

beforeEach(() => {
	jest.useFakeTimers();
	jest.spyOn(document, 'hasFocus').mockReturnValue(true);
	jest.mocked(sdk.rest.post).mockResolvedValue({} as never);
	chat = {
		composer: { focus: jest.fn() },
		messageEditing: { toPreviousMessage: jest.fn(), toNextMessage: jest.fn() },
		data: {},
	} as unknown as ChatAPI;
	mockUnreadSince = undefined;
	mockUploads = [];
	mockHandle.getVisibility.mockReturnValue(undefined);
	RoomHistoryManager.close(rid);
	RoomHistoryManager.updateRoom(rid, { loaded: 3, hasMore: false, hasMoreNext: false, unreadNotLoaded: 0 });
	RoomManager.back(rid);
	RoomManager.close(rid);
	RoomManager.open(rid);
	Messages.state.replaceAll([]);
});

afterEach(async () => {
	await act(async () => undefined);
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
	jest.restoreAllMocks();
	jest.clearAllMocks();
	act(() => Messages.state.replaceAll([]));
	selectedMessageStore.availableMessages.clear();
});

it('renders one list for the opened room and gives the next room a flag of its own (R1, R26)', () => {
	Messages.state.replaceAll([message('first-unread', 10)]);
	mockHandle.getVisibility.mockReturnValue(visibility({ isAtBottom: true }));
	const { switchTo } = renderBody();
	expect(screen.getAllByRole('list', { name: 'Message_list' })).toHaveLength(1);
	expect(mockListMounted).toHaveBeenCalledWith(rid);
	fireEvent.wheel(messagesArea());
	settleTimers(500);
	expect(markedAsRead()).toHaveLength(1);
	jest.mocked(sdk.rest.post).mockClear();

	RoomHistoryManager.updateRoom('other-room', { loaded: 3 });
	Messages.state.replaceAll([message('other-first-unread', 10, { rid: 'other-room' })]);
	switchTo({ room: createFakeRoom({ _id: 'other-room', t: 'p' }) });
	report({ isAtBottom: true });
	settleTimers(500);

	expect(mockListMounted).toHaveBeenCalledWith('other-room');
	expect(screen.getAllByRole('list', { name: 'Message_list' })).toHaveLength(1);
	expect(markedAsRead()).toHaveLength(0);

	fireEvent.wheel(messagesArea());
	settleTimers(500);

	expect(markedAsRead()).toHaveLength(1);
});

it('tells a viewer who cannot preview to join (R7)', () => {
	renderBody({ room: createFakeRoom({ _id: rid, t: 'c' }), subscription: null });

	expect(screen.getByText('You_must_join_to_view_messages_in_this_channel')).toBeInTheDocument();
	expect(lastListProps().canPreview).toBe(false);
});

it('lets a viewer who is subscribed preview a public channel (R7)', () => {
	renderBody({ room: createFakeRoom({ _id: rid, t: 'c' }) });

	expect(screen.queryByText('You_must_join_to_view_messages_in_this_channel')).not.toBeInTheDocument();
	expect(lastListProps().canPreview).toBe(true);
});

describe('the unread banner', () => {
	const bannerText = (count: number) => `${count} unread messages`;

	beforeEach(() => {
		mockUnreadSince = lastSeen;
	});

	it('shows the unread banner with its count only while there is one (R17)', () => {
		renderBody();
		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();
		cleanupBody();

		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 3 });
		renderBody();

		expect(screen.getByText(bannerText(3))).toBeInTheDocument();
	});

	it('counts the unloaded unread messages and the stored ones above the top message (R18)', () => {
		const messages = [message('seen', -10), message('first', 10), message('second', 20), message('third', 30)];
		Messages.state.replaceAll(messages);
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 2 });
		renderBody();
		expect(screen.getByText(bannerText(2))).toBeInTheDocument();

		report({ topMessage: messages[2] });
		settleTimers(300);

		expect(screen.getByText(bannerText(4))).toBeInTheDocument();
	});

	it('counts nothing for a viewer with no subscription (R18)', () => {
		Messages.state.replaceAll([message('first', 10), message('second', 20)]);
		renderBody({ subscription: null });

		report({ topMessage: message('second', 20) });
		settleTimers(300);

		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();
	});

	it('counts from the first report and recounts at most once in 300 ms (R19)', () => {
		const messages = [message('first', 10), message('second', 20), message('third', 30)];
		Messages.state.replaceAll(messages);
		renderBody();
		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();

		report({ topMessage: messages[0] });
		settleTimers(299);
		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();
		report({ topMessage: messages[1] });
		report({ topMessage: messages[2] });
		settleTimers(299);
		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();
		settleTimers(1);

		expect(screen.getByText(bannerText(3))).toBeInTheDocument();
	});

	it('counts nothing loaded when a report has no top message (R19)', () => {
		const messages = [message('first', 10), message('second', 20)];
		Messages.state.replaceAll(messages);
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 1 });
		renderBody();
		report({ topMessage: messages[1] });
		settleTimers(300);
		expect(screen.getByText(bannerText(3))).toBeInTheDocument();

		report({ topMessage: undefined });
		settleTimers(300);

		expect(screen.getByText('1 unread message')).toBeInTheDocument();
	});

	it('jumps to the first unread message, marks the room as read and zeroes the count (R20)', async () => {
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 2, firstUnread: message('first-unread', 10) });
		Messages.state.replaceAll([message('first-unread', 10), message('second', 20)]);
		renderBody();
		report({ topMessage: message('second', 20) });
		settleTimers(300);

		fireEvent.click(screen.getByText(bannerText(4)));
		await act(async () => undefined);

		expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith('first-unread', 'jumpToUnread');
		expect(markedAsRead()).toHaveLength(1);
		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();
	});

	it('jumps to the earliest listed message newer than the unread time when the room knows no first unread (R20)', async () => {
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 1, firstUnread: undefined });
		Messages.state.replaceAll([message('seen', -10), message('reply', 5, { tmid: 'main' }), message('earliest', 10), message('later', 20)]);
		renderBody();

		fireEvent.click(screen.getByText('1 unread message'));
		await act(async () => undefined);

		expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith('earliest', 'jumpToUnread');
	});

	it('does nothing when no message can be jumped to (R20)', async () => {
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 1, firstUnread: undefined });
		renderBody();

		fireEvent.click(screen.getByText('1 unread message'));
		await act(async () => undefined);

		expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
		expect(markedAsRead()).toHaveLength(0);
		expect(screen.getByText('1 unread message')).toBeInTheDocument();
	});

	it("marks the room as read from the banner's control (R22)", async () => {
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 2 });
		renderBody();

		fireEvent.click(screen.getByTitle('Mark as read'));
		await act(async () => undefined);

		expect(markedAsRead()).toHaveLength(1);
		expect(screen.queryByText(/unread message/)).not.toBeInTheDocument();
	});
});

describe('marking the room as read', () => {
	// The room has an unread message that is out of view, so only reaching the latest message lets the manager mark it as read
	beforeEach(() => {
		Messages.state.replaceAll([message('first-unread', 10)]);
	});

	const atTheLatestMessage = visibility({ isAtBottom: true, isFirstUnreadVisible: false });

	it.each([
		['input, at the bottom, nothing newer, the first page loaded', true, atTheLatestMessage, {}, true],
		['no input', false, atTheLatestMessage, {}, false],
		['input, but away from the bottom', true, visibility({ isAtBottom: false }), {}, false],
		['input, but nothing reported', true, undefined, {}, false],
		['input, at the bottom, but newer messages remain', true, atTheLatestMessage, { hasMoreNext: true }, false],
		['input, at the bottom, but the first page is not loaded', true, atTheLatestMessage, { loaded: undefined }, false],
	])(
		'answers that the viewer reached the latest message only after input, at the bottom, with nothing newer and the first page loaded: %s (R24)',
		(_, input, visible, history, marked) => {
			RoomHistoryManager.updateRoom(rid, history);
			mockHandle.getVisibility.mockReturnValue(visible);
			renderBody();

			if (input) {
				fireEvent.wheel(messagesArea());
			} else {
				report({ isAtBottom: true });
			}
			settleTimers(500);

			expect(markedAsRead()).toHaveLength(marked ? 1 : 0);
		},
	);

	it.each(['wheel', 'touchMove', 'keyDown', 'pointerDown', 'click'] as const)('counts a %s in the messages area as input (R25)', (kind) => {
		mockHandle.getVisibility.mockReturnValue(atTheLatestMessage);
		renderBody();

		fireEvent[kind](messagesArea());
		settleTimers(500);

		expect(markedAsRead()).toHaveLength(1);
	});

	it('does not count input in the composer or the banner (R25)', () => {
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 1 });
		mockUnreadSince = lastSeen;
		mockHandle.getVisibility.mockReturnValue(atTheLatestMessage);
		renderBody();

		fireEvent.wheel(screen.getByTestId('composer'));
		fireEvent.keyDown(screen.getByTestId('composer'));
		fireEvent.pointerDown(screen.getByTitle('Mark as read'));
		settleTimers(500);

		expect(markedAsRead()).toHaveLength(0);
	});

	it('asks for a debounced attempt on input that scrolls nothing (R27)', () => {
		mockHandle.getVisibility.mockReturnValue(atTheLatestMessage);
		const { manager } = renderBody();
		// The attempts the room asks for on opening settle first, so only the input is left to ask
		settleTimers(500);
		const attempt = jest.spyOn(manager, 'attemptMarkAsRead');
		attempt.mockClear();

		fireEvent.wheel(messagesArea());
		fireEvent.wheel(messagesArea());
		fireEvent.click(messagesArea());
		expect(attempt).not.toHaveBeenCalled();
		settleTimers(499);
		expect(attempt).not.toHaveBeenCalled();
		settleTimers(1);

		expect(attempt).toHaveBeenCalledTimes(1);
	});

	it('asks for an attempt on each report and does not mark a room opened with its first unread out of view (R28)', () => {
		const { manager } = renderBody();
		const attempt = jest.spyOn(manager, 'attemptMarkAsRead');
		attempt.mockClear();

		report({ isAtBottom: true, isFirstUnreadVisible: false });
		settleTimers(500);
		expect(attempt).toHaveBeenCalledTimes(1);
		expect(markedAsRead()).toHaveLength(0);

		mockHandle.getVisibility.mockReturnValue(visibility({ isAtBottom: true, isFirstUnreadVisible: true }));
		report({ isAtBottom: true, isFirstUnreadVisible: true });
		settleTimers(500);

		expect(attempt).toHaveBeenCalledTimes(2);
		expect(markedAsRead()).toHaveLength(1);
	});

	it('asks for an attempt when the room opens with an alert, and when the route changes (R29)', () => {
		const listeners = new Set<() => void>();
		const { manager } = renderBody({
			router: {
				getRouteName: () => 'channel',
				subscribeToRouteChange: (callback: () => void) => {
					listeners.add(callback);
					return () => listeners.delete(callback);
				},
			},
		});
		const attempt = jest.spyOn(manager, 'attemptMarkAsRead');

		settleTimers(500);
		expect(attempt).toHaveBeenCalledTimes(1);

		act(() => listeners.forEach((listener) => listener()));
		settleTimers(500);
		expect(attempt).toHaveBeenCalledTimes(2);
	});

	it("answers the first unread mark from the list's visibility, asked at the moment (R30)", () => {
		const { manager } = renderBody();
		mockHandle.getVisibility.mockReturnValue(visibility({ isFirstUnreadVisible: false }));
		manager.attemptMarkAsRead();
		expect(markedAsRead()).toHaveLength(0);

		mockHandle.getVisibility.mockReturnValue(visibility({ isFirstUnreadVisible: true }));
		manager.attemptMarkAsRead();
		expect(markedAsRead()).toHaveLength(1);

		jest.mocked(sdk.rest.post).mockClear();
		mockHandle.getVisibility.mockReturnValue(undefined);
		manager.attemptMarkAsRead();
		expect(markedAsRead()).toHaveLength(0);
	});
});

describe('select all', () => {
	it('scrolls the list to the top and selects the rendered messages from Select all (R45)', () => {
		selectedMessageStore.addAvailableMessage('rendered-1');
		selectedMessageStore.addAvailableMessage('rendered-2');
		renderBody();

		act(() => mockComposerProps.mock.lastCall?.[0].onClickSelectAll());

		expect(mockHandle.scrollToTop).toHaveBeenCalledTimes(1);
		expect(selectedMessageStore.getSelectedMessages().sort()).toEqual(['rendered-1', 'rendered-2']);
		act(() => selectedMessageStore.clearStore());
	});
});

describe('what the room keeps', () => {
	it('keeps the announcement, the upload progress, the banner, the composer and the drop target (R55)', () => {
		mockUnreadSince = lastSeen;
		mockUploads = [{ id: 'upload' }];
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 1 });
		renderBody({ room: createFakeRoom({ _id: rid, t: 'p', announcement: 'announced' }) });

		expect(screen.getByText('Room announcement')).toBeInTheDocument();
		expect(screen.getByText('Upload progress')).toBeInTheDocument();
		expect(screen.getByText('1 unread message')).toBeInTheDocument();
		expect(screen.getByTestId('composer')).toBeInTheDocument();
		expect(screen.getByTestId('drop-target')).toBeInTheDocument();
		expect(mockComposerProps.mock.lastCall?.[0]).not.toHaveProperty('onResize');
	});

	it('closes the contextual bar by a click in the messages that is not on a button or a link while hideFlexTab is on (R55)', async () => {
		mockUnreadSince = lastSeen;
		RoomHistoryManager.updateRoom(rid, { unreadNotLoaded: 1 });
		renderBody({ preferences: { hideFlexTab: true } });

		fireEvent.click(messagesArea());
		expect(toolbox.closeTab).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByTitle('Mark as read'));
		await act(async () => undefined);
		expect(toolbox.closeTab).toHaveBeenCalledTimes(1);
	});

	it('leaves the contextual bar open while hideFlexTab is off (R55)', () => {
		renderBody();

		fireEvent.click(messagesArea());

		expect(toolbox.closeTab).not.toHaveBeenCalled();
	});

	it('does not shorten the element around the list while newer messages remain (R57)', () => {
		RoomHistoryManager.updateRoom(rid, { hasMoreNext: true });
		renderBody();

		expect(screen.getByRole('list', { name: 'Message_list' }).closest('.wrapper')).toHaveClass('wrapper', { exact: true });
	});

	it('gives the list the height of what it draws over the top of the list, as it changes (R61)', () => {
		let height = 40;
		jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => height);
		mockUploads = [{ id: 'upload' }];
		renderBody();
		expect(lastListProps().overlayTopInset).toBe(40);

		const overlays = screen.getByText('Upload progress').parentElement;
		const observers = jest.mocked(ResizeObserver);
		const observing = observers.mock.results.findIndex(
			(result) => result.type === 'return' && jest.mocked(result.value.observe).mock.calls.some(([element]) => element === overlays),
		);
		const [onResize] = observers.mock.calls[observing];
		height = 0;
		act(() => onResize([], {} as ResizeObserver));

		expect(lastListProps().overlayTopInset).toBe(0);
	});

	it('puts the composer after the list (R56)', () => {
		renderBody();

		const list = screen.getByRole('list', { name: 'Message_list' });
		expect(list.compareDocumentPosition(screen.getByTestId('composer')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});
});

describe('a room whose first page failed to load', () => {
	it('retries the first page on input in an empty room (R59)', () => {
		const getMore = jest.spyOn(RoomHistoryManager, 'getMore').mockResolvedValue(undefined);
		RoomHistoryManager.updateRoom(rid, { loaded: undefined, hasMore: true });
		renderBody();
		expect(getMore).not.toHaveBeenCalled();

		fireEvent.wheel(messagesArea());

		expect(getMore).toHaveBeenCalledWith(rid);
	});

	it('does not retry in a room the viewer cannot preview, where every input would meet a refusal (R59)', () => {
		const getMore = jest.spyOn(RoomHistoryManager, 'getMore').mockResolvedValue(undefined);
		RoomHistoryManager.updateRoom(rid, { loaded: undefined, hasMore: true });
		renderBody({ room: createFakeRoom({ _id: rid, t: 'c' }), subscription: null });

		fireEvent.wheel(messagesArea());

		expect(getMore).not.toHaveBeenCalled();
	});

	it('does not retry once the first page is loaded (R59)', () => {
		const getMore = jest.spyOn(RoomHistoryManager, 'getMore').mockResolvedValue(undefined);
		renderBody();

		fireEvent.wheel(messagesArea());

		expect(getMore).not.toHaveBeenCalled();
	});
});

it('opens the thread of a message that belongs to one, as the room always has (R34)', async () => {
	renderBody({
		router: { getSearchParameters: () => ({ msg: 'reply' }), subscribeToRouteChange: () => () => undefined },
		configure: (root) =>
			root.withEndpoint('GET', '/v1/chat.getMessage', (async () => ({
				message: { ...message('reply', 10), tmid: 'main', _updatedAt: at(10).toISOString(), ts: at(10).toISOString() },
			})) as never),
	});

	for (let tick = 0; tick < 5; tick++) {
		await act(async () => {
			jest.advanceTimersByTime(10);
		});
	}

	expect(mockGoToRoom).toHaveBeenCalledWith(rid, expect.objectContaining({ routeParamsOverrides: { tab: 'thread', context: 'main' } }));
});
