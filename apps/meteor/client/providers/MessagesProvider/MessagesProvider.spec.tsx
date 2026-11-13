import type { IMessage, ISubscription, MessageAttachment, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { MarkdownTextContext, TooltipProvider } from '@rocket.chat/ui-client';
import { ModalContext } from '@rocket.chat/ui-contexts';
import {
	MessageReactionList,
	useMessageContent,
	useMessageDisplay,
	useIsMessageBeingEdited,
	useMessageInteractions,
	useMessageNavigation,
	useMessageRelatedData,
	useMessageRenderers,
	messageRenderersDefaultValue,
	useIsMessageSelected,
	useIsSelectingMessages,
	useMessageMedia,
	useMessageMediaPlayer,
	MessageAttachments,
} from '@rocket.chat/ui-message-list';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import MessagesProvider from './MessagesProvider';
import { messageSelectionFromStore, roomMessageSelection } from './messageSelectionFromStore';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';
import { actionLinks } from '../../lib/actionLinks';
import type { ChatAPI } from '../../lib/chats/ChatAPI';
import { clearEditingMessage, setEditingMessage } from '../../lib/chats/editingMessageSubscription';
import { Messages, Roles, Rooms, Subscriptions } from '../../stores';
import { ChatContext } from '../../views/room/contexts/ChatContext';
import { SelectedMessageStore, selectedMessageStore } from '../../views/room/providers/SelectedMessageStore';
import type { MediaPlayerContextValue } from '../MediaPlayerProvider';
import { MediaPlayerContext } from '../MediaPlayerProvider';

jest.mock('../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../lib/autotranslate', () => ({ AutoTranslate: { getLanguage: () => 'pt', messageIdsToWait: {} } }));
const mockDownloadAs = jest.fn();
jest.mock('../../lib/download', () => ({ downloadAs: (...args: unknown[]) => mockDownloadAs(...args) }));
jest.mock('../../lib/getPermaLink', () => ({ getPermaLink: async (id: string) => `permalink/${id}` }));
const mockOpenRouteLink = jest.fn();
const mockSetMessageJump = jest.fn();
jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { isLivechatRoom: () => false, openRouteLink: (...args: unknown[]) => mockOpenRouteLink(...args) },
}));
jest.mock('../../lib/utils/setMessageJumpQueryStringParameter', () => ({
	setMessageJumpQueryStringParameter: (...args: unknown[]) => mockSetMessageJump(...args),
}));

const appRoot = () =>
	mockAppRoot().withJohnDoe().withSetting('Message_Read_Receipt_Enabled', true).withUserPreference('displayAvatars', true);

describe('display', () => {
	it('shows messages as the settings and the viewer preferences say (R26)', () => {
		const { result } = renderHook(() => useMessageDisplay(), {
			wrapper: appRoot()
				.withUserPreference('hideRoles', true)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current).toMatchObject({
			showRoles: false,
			showAvatars: true,
			readReceipts: { enabled: true, storeUsers: false },
			allowsInteraction: true,
		});
	});

	it('turns interaction off for read-only places (R26)', () => {
		const { result } = renderHook(() => useMessageDisplay(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider allowsInteraction={false}>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current.allowsInteraction).toBe(false);
	});

	it('tells whether the viewer starred a message (R26)', () => {
		const { result } = renderHook(() => useMessageDisplay(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider subscription={createFakeSubscription({ t: 'c' })}>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current.isStarred(createFakeMessage({ starred: [{ _id: 'john.doe' }] }))).toBe(true);
		expect(result.current.isStarred(createFakeMessage({ starred: [{ _id: 'someone-else' }] }))).toBe(false);
	});
});

describe('display of the viewer preferences', () => {
	const display = (root: ReturnType<typeof appRoot>) =>
		renderHook(() => useMessageDisplay(), {
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>).build(),
		}).result.current;

	it('carries the settings and preferences that change how a message reads (R26)', () => {
		const value = display(
			appRoot()
				.withSetting('UI_Use_Real_Name', true)
				.withSetting('HexColorPreview_Enabled', true)
				.withSetting('API_Embed', true)
				.withSetting('Message_CustomDomain_AutoLink', 'example.dev')
				.withSetting('Katex_Dollar_Syntax', true)
				.withUserPreference('highlights', [' alpha '])
				.withUserPreference('hideUsernames', true),
		);

		expect(value).toMatchObject({
			showRealName: true,
			showUsername: false,
			showColors: true,
			embedsEnabled: true,
			autoLinkDomains: 'example.dev',
			katex: { dollarSyntaxEnabled: true },
		});
		expect(value.highlights?.map(({ highlight }) => highlight)).toEqual(['alpha']);
		expect(value.formatDate(new Date('2024-01-15T12:00:00Z'))).toContain('2024');
		expect(value.formatTime(new Date('2024-01-15T12:00:00Z'))).toEqual(expect.any(String));
		expect(value.formatDateAndTime(new Date('2024-01-15T12:00:00Z'))).toContain('2024');
	});

	it('shows usernames unless the viewer hides them, and no embeds by default (R26)', () => {
		const value = display(appRoot());

		expect(value).toMatchObject({ showUsername: true, showRealName: false, showColors: false, embedsEnabled: false });
	});
});

describe('interactions', () => {
	it('reacts to a message through the REST API (R28)', async () => {
		const react = jest.fn().mockResolvedValue({ success: true });
		const message = createFakeMessage({ _id: 'message-id' });

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.withEndpoint('POST', '/v1/chat.react', react)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		result.current.toggleReaction(message, ':tada:');

		await waitFor(() => expect(react).toHaveBeenCalledWith({ messageId: 'message-id', reaction: ':tada:' }));
	});

	it('follows and unfollows a thread through the REST API (R28)', async () => {
		const follow = jest.fn().mockResolvedValue({ success: true });
		const unfollow = jest.fn().mockResolvedValue({ success: true });
		const message = createFakeMessage({ _id: 'thread-id', rid: 'room-id' });

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.withEndpoint('POST', '/v1/chat.followMessage', follow)
				.withEndpoint('POST', '/v1/chat.unfollowMessage', unfollow)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		result.current.followThread(message);
		await waitFor(() => expect(follow).toHaveBeenCalledWith({ mid: 'thread-id' }));

		result.current.unfollowThread(message);
		await waitFor(() => expect(unfollow).toHaveBeenCalledWith({ mid: 'thread-id' }));
	});

	it('shows an error toast when following a thread fails (R28)', async () => {
		const failure = new Error('not allowed');
		const follow = jest.fn().mockRejectedValue(failure);
		const dispatchToastMessage = jest.fn();

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.withEndpoint('POST', '/v1/chat.followMessage', follow)
				.withToastMessageDispatch(dispatchToastMessage)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		result.current.followThread(createFakeMessage({ _id: 'thread-id', rid: 'room-id' }));

		await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: failure }));
	});

	it('tells whether the viewer reacted with an emoji (R28)', () => {
		const message = createFakeMessage({ reactions: { ':tada:': { usernames: ['john.doe'] } } });

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current.hasReacted(message, ':tada:')).toBe(true);
		expect(result.current.hasReacted(message, ':eyes:')).toBe(false);
	});
});

describe('interactions of the app', () => {
	const setup = (chat?: Partial<ChatAPI>, setModal = jest.fn()) =>
		renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => (
					<ModalContext.Provider value={{ modal: { setModal }, currentModal: { component: null } } as never}>
						<ChatContext.Provider value={chat as ChatAPI | undefined}>
							<MessagesProvider>{children}</MessagesProvider>
						</ChatContext.Provider>
					</ModalContext.Provider>
				))
				.build(),
		});

	it('acts on the composer and the chat of the open conversation (R28)', async () => {
		const chat = {
			composer: { quoteMessage: jest.fn(), replyWith: jest.fn() },
			flows: { sendMessage: jest.fn(), requestMessageDeletion: jest.fn(), replyBroadcast: jest.fn() },
			messageEditing: { editMessage: jest.fn() },
			data: { getMessageByID: jest.fn().mockResolvedValue(createFakeMessage({ _id: 'quoted' })) },
		};
		const message = createFakeMessage({ _id: 'mid', msg: 'text' });
		const { result } = setup(chat as unknown as Partial<ChatAPI>);

		result.current.quote(message);
		await result.current.quoteMessageById('quoted');
		await result.current.replyWith('reply');
		await result.current.sendMessage('hello');
		result.current.edit(message);
		result.current.requestDeletion(message);
		result.current.replyBroadcast(message);

		expect(chat.composer.quoteMessage).toHaveBeenCalledTimes(2);
		expect(chat.composer.replyWith).toHaveBeenCalledWith('reply');
		expect(chat.flows.sendMessage).toHaveBeenCalledWith({ text: 'hello' });
		expect(chat.messageEditing.editMessage).toHaveBeenCalledWith(message);
		expect(chat.flows.requestMessageDeletion).toHaveBeenCalledWith(message);
		expect(chat.flows.replyBroadcast).toHaveBeenCalledWith(message);
		expect(result.current.canDelete(message)).toBe(true);
	});

	it('quotes the message a quote action names, as the chat fetches it (R28)', async () => {
		const quoted = createFakeMessage({ _id: 'message-id' });
		const chat = { composer: { quoteMessage: jest.fn() }, data: { getMessageByID: jest.fn().mockResolvedValue(quoted) } };
		const { result } = setup(chat as unknown as Partial<ChatAPI>);

		await result.current.quoteMessageById('message-id');

		expect(chat.data.getMessageByID).toHaveBeenCalledWith('message-id');
		expect(chat.composer.quoteMessage).toHaveBeenCalledWith(quoted);
	});

	it('sends, replies and quotes nothing outside a room (R28)', async () => {
		const { result } = setup(undefined);

		await expect(result.current.sendMessage('hello')).resolves.toBeUndefined();
		await expect(result.current.replyWith('hello')).resolves.toBeUndefined();
		await expect(result.current.quoteMessageById('message-id')).resolves.toBeUndefined();
	});

	it('only offers deletion where a chat is open (R28)', () => {
		const { result } = setup(undefined);

		expect(result.current.canDelete(createFakeMessage())).toBe(false);
	});

	it('opens the modals of the actions on a message (R28)', async () => {
		const setModal = jest.fn();
		const { result } = setup(undefined, setModal);
		const message = createFakeMessage({ _id: 'mid', reactions: { ':tada:': { usernames: ['john.doe'] } } });

		result.current.openReport(message);
		result.current.openReactionList(message);
		result.current.openReadReceipts(message);
		result.current.startDiscussion(message);
		await result.current.openForward(message);

		await waitFor(() => expect(setModal).toHaveBeenCalledTimes(5));
	});
});

describe('the reaction picker', () => {
	const event = { nativeEvent: { stopImmediatePropagation: jest.fn() }, currentTarget: document.body } as never;

	const interactionsOf = (chat: Partial<ChatAPI> | undefined, root = appRoot()) =>
		renderHook(() => useMessageInteractions(), {
			wrapper: root
				.wrap((children: ReactNode) => (
					<ChatContext.Provider value={chat as ChatAPI | undefined}>
						<MessagesProvider>{children}</MessagesProvider>
					</ChatContext.Provider>
				))
				.build(),
		}).result.current;

	it('opens in the open chat, tells when it closes and reacts with the emoji picked (message-toolbar R23)', async () => {
		const react = jest.fn().mockResolvedValue({ success: true });
		const open = jest.fn();
		const onClose = jest.fn();
		const { openReactionPicker } = interactionsOf(
			{ emojiPicker: { open } } as unknown as ChatAPI,
			appRoot().withEndpoint('POST', '/v1/chat.react', react),
		);

		openReactionPicker(event, createFakeMessage({ _id: 'mid' }), { onClose });

		expect(open).toHaveBeenCalledWith(document.body, expect.any(Function), onClose);
		expect(onClose).not.toHaveBeenCalled();

		open.mock.calls[0][1]('tada');

		await waitFor(() => expect(react).toHaveBeenCalledWith({ messageId: 'mid', reaction: ':tada:' }));
	});

	it('tells it closed when it could not open, for a viewer who is not logged in and without a chat (message-toolbar R23)', () => {
		const open = jest.fn();
		const noUser = interactionsOf({ emojiPicker: { open } } as unknown as ChatAPI, mockAppRoot());
		const noChat = interactionsOf(undefined);
		const onClose = jest.fn();

		noUser.openReactionPicker(event, createFakeMessage(), { onClose });
		noChat.openReactionPicker(event, createFakeMessage(), { onClose });

		expect(onClose).toHaveBeenCalledTimes(2);
		expect(open).not.toHaveBeenCalled();
	});
});

describe('interactions of the toolbar menu', () => {
	const interactionsOf = (root: ReturnType<typeof appRoot>) =>
		renderHook(() => useMessageInteractions(), {
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>).build(),
		}).result.current;

	beforeEach(() => {
		Messages.state.store(createFakeMessage({ _id: 'mid', rid: 'rid' }));
	});

	afterEach(() => {
		Messages.state.replaceAll([]);
	});

	it('pins, unpins, stars and unstars through the REST API (R28)', async () => {
		const calls = { pin: jest.fn(), unpin: jest.fn(), star: jest.fn(), unstar: jest.fn() };
		const interactions = interactionsOf(
			appRoot()
				.withEndpoint('POST', '/v1/chat.pinMessage', calls.pin.mockResolvedValue({ success: true }))
				.withEndpoint('POST', '/v1/chat.unPinMessage', calls.unpin.mockResolvedValue({ success: true }))
				.withEndpoint('POST', '/v1/chat.starMessage', calls.star.mockResolvedValue({ success: true }))
				.withEndpoint('POST', '/v1/chat.unStarMessage', calls.unstar.mockResolvedValue({ success: true })),
		);
		const message = createFakeMessage({ _id: 'mid', rid: 'rid' });

		interactions.pin(message);
		interactions.unpin(message);
		interactions.star(message);
		interactions.unstar(message);

		await waitFor(() => {
			for (const call of Object.values(calls)) {
				expect(call).toHaveBeenCalledWith({ messageId: 'mid' });
			}
		});
	});

	it('marks a message unread for the subscription of its room (R28)', async () => {
		const unread = jest.fn().mockResolvedValue({ success: true });
		Subscriptions.state.store(createFakeSubscription({ rid: 'rid' }));
		const interactions = interactionsOf(appRoot().withEndpoint('POST', '/v1/subscriptions.unread', unread));

		interactions.markUnread(createFakeMessage({ _id: 'mid', rid: 'rid' }));

		await waitFor(() => expect(unread).toHaveBeenCalledWith({ firstUnreadMessage: { _id: 'mid' } }));
		Subscriptions.state.replaceAll([]);
	});

	it('translates a message and goes back to its original (R28)', async () => {
		const translate = jest.fn().mockResolvedValue({ success: true });
		const interactions = interactionsOf(appRoot().withEndpoint('POST', '/v1/autotranslate.translateMessage', translate));
		const message = createFakeMessage({ _id: 'mid', rid: 'rid' });

		interactions.translate(message);

		await waitFor(() => expect(translate).toHaveBeenCalledWith({ messageId: 'mid', targetLanguage: 'pt' }));
		expect(Messages.state.get('mid')).toMatchObject({ autoTranslateFetching: true, autoTranslateShowInverse: true });

		interactions.showOriginal(message);

		expect(Messages.state.get('mid')).not.toHaveProperty('autoTranslateShowInverse');
	});
});

describe('interactions without a logged-in user', () => {
	it('does not react or open the reaction picker (R28)', async () => {
		const react = jest.fn().mockResolvedValue({ success: true });
		const open = jest.fn();
		const chat = { emojiPicker: { open } } as unknown as ChatAPI;

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: mockAppRoot()
				.withEndpoint('POST', '/v1/chat.react', react)
				.wrap((children: ReactNode) => (
					<ChatContext.Provider value={chat}>
						<MessagesProvider>{children}</MessagesProvider>
					</ChatContext.Provider>
				))
				.build(),
		});

		result.current.toggleReaction(createFakeMessage(), ':tada:');
		result.current.openReactionPicker(
			{ nativeEvent: { stopImmediatePropagation: jest.fn() }, currentTarget: document.body } as never,
			createFakeMessage(),
		);

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(react).not.toHaveBeenCalled();
		expect(open).not.toHaveBeenCalled();
	});
});

describe('selection', () => {
	it("reads and toggles the room's selection (R31)", () => {
		const store = new SelectedMessageStore();
		const selection = messageSelectionFromStore(store);

		const { result } = renderHook(() => ({ isSelecting: useIsSelectingMessages(), isSelected: useIsMessageSelected('message-id') }), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider selection={selection}>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current).toEqual({ isSelecting: false, isSelected: false });

		act(() => {
			store.setIsSelecting(true);
			store.toggle('message-id');
		});

		expect(result.current).toEqual({ isSelecting: true, isSelected: true });
	});
});

it('leaves a place without a selection out of the room selection (R31)', () => {
	const { result } = renderHook(() => ({ isSelecting: useIsSelectingMessages(), isSelected: useIsMessageSelected('message-id') }), {
		wrapper: appRoot()
			.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
			.build(),
	});

	expect(result.current).toEqual({ isSelecting: false, isSelected: false });
});

describe('the selection of the room (message-variants R48)', () => {
	afterEach(() => act(() => selectedMessageStore.reset()));

	it("is one instance over the room's store, which the places that give it share (message-variants R48)", () => {
		const { result } = renderHook(() => ({ isSelecting: useIsSelectingMessages(), isSelected: useIsMessageSelected('message-id') }), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider selection={roomMessageSelection}>{children}</MessagesProvider>)
				.build(),
		});

		act(() => {
			selectedMessageStore.setIsSelecting(true);
			selectedMessageStore.toggle('message-id');
		});

		expect(result.current).toEqual({ isSelecting: true, isSelected: true });
	});

	it("leaves a place that is given none out of the room's selection, whatever state it is in (message-variants R48)", () => {
		const { result } = renderHook(() => ({ isSelecting: useIsSelectingMessages(), isSelected: useIsMessageSelected('message-id') }), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		act(() => {
			selectedMessageStore.setIsSelecting(true);
			selectedMessageStore.toggle('message-id');
		});

		expect(result.current).toEqual({ isSelecting: false, isSelected: false });
	});
});

describe('navigation', () => {
	it('runs a legacy action link of a message (R29)', () => {
		const run = jest.spyOn(actionLinks, 'run').mockImplementation(() => undefined);
		const message = createFakeMessage();

		const { result } = renderHook(() => useMessageNavigation(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		result.current.runActionLink(message, 'method-id');

		expect(run).toHaveBeenCalledWith('method-id', message);
		run.mockRestore();
	});

	it('opens a thread through the router of the app (R29)', () => {
		const navigate = jest.fn();

		const { result } = renderHook(() => useMessageNavigation(), {
			wrapper: appRoot()
				.withRouter({ navigate, getRouteName: () => 'channel' })
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		result.current.openThread({ rid: 'rid', tmid: 'tmid', messageId: 'mid' });

		expect(navigate).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'channel', params: expect.objectContaining({ rid: 'rid', tab: 'thread', context: 'tmid' }) }),
			{ replace: false },
		);
	});
});

describe('replying in a thread from a message', () => {
	const setup = (router: { navigate: jest.Mock; getRouteName: () => 'channel' | undefined }) =>
		renderHook(() => useMessageNavigation(), {
			wrapper: appRoot()
				.withRouter({
					...router,
					getRouteParameters: () => ({ rid: 'rid', name: 'general' }),
					getSearchParameters: () => ({ msg: 'jumped' }),
				})
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		}).result.current;

	it('opens the thread of the message in the current route and drops the search parameters (message-toolbar R23)', () => {
		const navigate = jest.fn();
		const { replyInThread } = setup({ navigate, getRouteName: () => 'channel' });

		replyInThread(createFakeMessage({ _id: 'mid', rid: 'rid' }));
		replyInThread(createFakeMessage({ _id: 'reply', rid: 'rid', tmid: 'parent' }));

		expect(navigate).toHaveBeenNthCalledWith(1, {
			name: 'channel',
			params: { rid: 'rid', name: 'general', tab: 'thread', context: 'mid' },
		});
		expect(navigate).toHaveBeenNthCalledWith(2, {
			name: 'channel',
			params: { rid: 'rid', name: 'general', tab: 'thread', context: 'parent' },
		});
	});

	it('goes nowhere when the route has no name (message-toolbar R23)', () => {
		const navigate = jest.fn();
		const { replyInThread } = setup({ navigate, getRouteName: () => undefined });

		replyInThread(createFakeMessage({ _id: 'mid', rid: 'rid' }));

		expect(navigate).not.toHaveBeenCalled();
	});
});

describe('navigation of the app', () => {
	const setup = (root = appRoot()) =>
		renderHook(() => useMessageNavigation(), {
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>).build(),
		});

	it('opens a room, jumps to a message and resolves a permalink (R29)', async () => {
		const room = createFakeRoom({ _id: 'rid', t: 'c' });
		const { result } = setup(appRoot().withEndpoint('GET', '/v1/rooms.info', () => ({ room, success: true }) as never));

		result.current.openRoom('rid');
		await waitFor(() =>
			expect(mockOpenRouteLink).toHaveBeenCalledWith('c', expect.objectContaining({ rid: 'rid' }), expect.anything(), undefined),
		);

		result.current.jumpToMessage({ _id: 'mid', rid: 'rid' });
		expect(mockSetMessageJump).toHaveBeenCalledWith('mid');

		await expect(result.current.getPermalink('mid')).resolves.toBe('permalink/mid');
	});

	it('opens a direct message and an external link (R29)', () => {
		const open = jest.spyOn(window, 'open').mockImplementation(() => null);
		const { result } = setup();

		result.current.openDirectMessage('alice');
		expect(mockOpenRouteLink).toHaveBeenCalledWith('d', { name: 'alice' }, expect.anything());

		result.current.openExternalLink('https://example.com');
		expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener noreferrer');

		open.mockRestore();
	});
});

describe('content options', () => {
	const normalize = (
		root: ReturnType<typeof appRoot>,
		msg: string,
		props: Parameters<typeof createFakeMessage>[0] = {},
		subscription?: ISubscription,
	) => {
		const message = { ...createFakeMessage({ msg, ...props }), md: undefined } as unknown as IMessage;
		const { result } = renderHook(() => useMessageContent().useNormalizedMessage(message), {
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider subscription={subscription}>{children}</MessagesProvider>).build(),
		});
		return result.current;
	};

	it('parses with the colors setting (R27)', () => {
		expect(JSON.stringify(normalize(appRoot().withSetting('HexColorPreview_Enabled', true), 'color:#ff0000').md)).toContain('COLOR');
		expect(JSON.stringify(normalize(appRoot(), 'color:#ff0000').md)).not.toContain('COLOR');
	});

	it('parses with the custom auto-link domains (R27)', () => {
		const withDomain = appRoot().withSetting('Message_CustomDomain_AutoLink', 'zzz');

		expect(JSON.stringify(normalize(withDomain, 'visit example.zzz').md)).toContain('LINK');
		expect(JSON.stringify(normalize(appRoot(), 'visit example.zzz').md)).not.toContain('LINK');
	});

	it('parses with the KaTeX syntaxes the settings enable (R27)', () => {
		expect(JSON.stringify(normalize(appRoot().withSetting('Katex_Dollar_Syntax', true), '$x^2$').md)).toContain('KATEX');
		expect(JSON.stringify(normalize(appRoot(), '$x^2$').md)).not.toContain('KATEX');
	});

	it('shows the translation of a conversation that translates (R27)', () => {
		const subscription = createFakeSubscription({ t: 'c', autoTranslate: true, autoTranslateLanguage: 'pt' });
		const root = appRoot().withSetting('AutoTranslate_Enabled', true);
		const translated = normalize(
			root,
			'hello',
			{ u: { _id: 'other', username: 'other' }, translations: { pt: 'ola' } } as never,
			subscription,
		);

		expect(translated.mdSource).toBe('ola');
	});
});

describe('what a message is displayed as', () => {
	const encryption = { key: { kty: 'oct' }, iv: 'initialization-vector' };

	const buildAttachment = (fields: Record<string, unknown>) =>
		({ type: 'file', title: 'file', title_link: '/file-upload/id/file', encryption, ...fields }) as unknown as MessageAttachment;

	const normalize = (message: Partial<IMessage>, root = appRoot()) => {
		const { result } = renderHook(() => useMessageContent().useNormalizedMessage(createFakeMessage(message)), {
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>).build(),
		});
		return result.current;
	};

	const firstAttachment = (message: Partial<IMessage>) => normalize(message).attachments?.[0] as unknown as Record<string, string>;

	const readKey = (url: string) => JSON.parse(atob(decodeURIComponent(url.split('?key=')[1])));

	it('should parse the message text (R27)', () => {
		expect(normalize({ msg: 'hello' }).md).toEqual([expect.objectContaining({ type: 'PARAGRAPH' })]);
	});

	it('should read an emoticon in the text as an emoji (R27)', () => {
		expect(JSON.stringify(normalize({ msg: ':)' }).md)).toContain('"EMOJI"');
	});

	describe('with math formulas', () => {
		const countFormulas = (root: ReturnType<typeof appRoot>) =>
			JSON.stringify(normalize({ msg: 'see $x^2$ and \\(y^2\\)' }, root).md).split('"INLINE_KATEX"').length - 1;

		it('should parse no formula when math is off (R27)', () => {
			expect(countFormulas(appRoot().withSetting('Katex_Enabled', false))).toBe(0);
		});

		it('should parse the dollar syntax when it is on (R27)', () => {
			expect(countFormulas(appRoot().withSetting('Katex_Dollar_Syntax', true).withSetting('Katex_Parenthesis_Syntax', false))).toBe(1);
		});

		it('should parse the parenthesis syntax when it is on (R27)', () => {
			expect(countFormulas(appRoot().withSetting('Katex_Dollar_Syntax', false).withSetting('Katex_Parenthesis_Syntax', true))).toBe(1);
		});
	});

	it('should leave an attachment with no encryption as it is (R27)', () => {
		const attachment = buildAttachment({ encryption: undefined, image_url: '/file-upload/id/image', image_type: 'image/png' });

		expect(firstAttachment({ attachments: [attachment] })).toMatchObject({
			title_link: '/file-upload/id/file',
			image_url: '/file-upload/id/image',
		});
	});

	it.each([
		['image', { image_url: '/file-upload/id/media', image_type: 'image/png' }, 'image_url'],
		['audio', { audio_url: '/file-upload/id/media', audio_type: 'audio/mpeg' }, 'audio_url'],
		['video', { video_url: '/file-upload/id/media', video_type: 'video/mp4' }, 'video_url'],
	])('should send an encrypted %s and its link through the decrypt route (R27)', (_type, fields, urlField) => {
		const attachment = firstAttachment({ attachments: [buildAttachment(fields)] });

		expect(attachment[urlField]).toMatch(/^\/file-decrypt\/file-upload\/id\/media\?key=/);
		expect(attachment.title_link).toMatch(/^\/file-decrypt\/file-upload\/id\/file\?key=/);
	});

	it.each([
		['link', { title_link: '/file-decrypt/file-upload/id/file?key=old' }, 'title_link'],
		['image', { image_url: '/file-decrypt/file-upload/id/media?key=old', image_type: 'image/png' }, 'image_url'],
		['audio', { audio_url: '/file-decrypt/file-upload/id/media?key=old', audio_type: 'audio/mpeg' }, 'audio_url'],
		['video', { video_url: '/file-decrypt/file-upload/id/media?key=old', video_type: 'video/mp4' }, 'video_url'],
	])('should not rewrite a %s that already uses the decrypt route (R27)', (_type, fields, urlField) => {
		const attachment = firstAttachment({ attachments: [buildAttachment(fields)] });

		expect(attachment[urlField]).toMatch(/\?key=old$/);
	});

	it('should put the encryption data, the file name and the file type in the key (R27)', () => {
		const attachment = firstAttachment({
			file: { _id: 'file-id', name: 'report.pdf', type: 'application/pdf' } as IMessage['file'],
			attachments: [buildAttachment({})],
		});

		expect(readKey(attachment.title_link)).toEqual({ ...encryption, name: 'report.pdf', type: 'application/pdf' });
	});

	it('should leave the file name out of the key of a message with no file (R27)', () => {
		const attachment = firstAttachment({ attachments: [buildAttachment({})] });

		expect(readKey(attachment.title_link)).toEqual(encryption);
	});

	it('should not rewrite the link of an encrypted attachment that is not a file (R27)', () => {
		const attachment = firstAttachment({ attachments: [buildAttachment({ type: 'other' })] });

		expect(attachment.title_link).toBe('/file-upload/id/file');
	});

	it('should accept a file name with characters outside Latin-1 (R27)', () => {
		const attachment = firstAttachment({
			file: { _id: 'file-id', name: '報告.pdf', type: 'application/pdf' } as IMessage['file'],
			attachments: [buildAttachment({})],
		});

		const { name } = readKey(attachment.title_link);

		expect(new TextDecoder().decode(Uint8Array.from(name as string, (char) => char.charCodeAt(0)))).toBe('報告.pdf');
	});

	it('should process the attachments inside a quote (R27)', () => {
		const quote = {
			text: 'quoted',
			message_link: 'http://localhost/channel/general?msg=id',
			attachments: [buildAttachment({})],
		} as unknown as MessageAttachment;

		const [quoted] = firstAttachment({ attachments: [quote] }).attachments as unknown as Record<string, string>[];

		expect(quoted.title_link).toMatch(/^\/file-decrypt\//);
	});
});

describe('content', () => {
	it('parses a given message object once per options (R27)', () => {
		const message = createFakeMessage({ msg: 'hello *world*' });

		const { result } = renderHook(
			() => {
				const { useNormalizedMessage } = useMessageContent();
				return [useNormalizedMessage(message), useNormalizedMessage(message)] as const;
			},
			{
				wrapper: appRoot()
					.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
					.build(),
			},
		);

		const [first, second] = result.current;
		expect(first.md.length).toBeGreaterThan(0);
		expect(first.mdSource).toBe('hello *world*');
		expect(second).toBe(first);
	});
});

it('names no emoji sprite for an emoji the app cannot render (R27)', () => {
	const { result } = renderHook(() => useMessageContent(), {
		wrapper: appRoot()
			.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
			.build(),
	});

	expect(result.current.getEmojiData(':not-an-emoji:')).toMatchObject({ name: '', content: '' });
});

describe('related data', () => {
	const reactedBy = (names: string[]) => ({
		message: createFakeMessage({
			_id: 'reacted',
			reactions: { ':smile:': { usernames: names.map((name) => name.toLowerCase()), names } },
		}),
	});

	it('lists someone who reacted after the reactions were last read (R14)', async () => {
		const getMessage = jest
			.fn()
			.mockResolvedValueOnce(reactedBy(['Alice']))
			.mockResolvedValueOnce(reactedBy(['Alice', 'Bob']));

		const { result, rerender } = renderHook(
			({ revision }) => useMessageRelatedData().useMessageById('reacted', { enabled: true, revision }),
			{
				initialProps: { revision: ['alice'] },
				wrapper: appRoot()
					.withEndpoint('GET', '/v1/chat.getMessage', getMessage)
					.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
					.build(),
			},
		);

		await waitFor(() => expect(result.current.data?.reactions?.[':smile:'].names).toEqual(['Alice']));

		rerender({ revision: ['alice', 'bob'] });

		await waitFor(() => expect(result.current.data?.reactions?.[':smile:'].names).toEqual(['Alice', 'Bob']));
	});

	it('reuses the message it fetched while the reactions are the same (R14)', async () => {
		const getMessage = jest.fn().mockResolvedValue(reactedBy(['Alice']));

		const { result, rerender } = renderHook(
			({ revision }) => useMessageRelatedData().useMessageById('reacted', { enabled: true, revision }),
			{
				initialProps: { revision: ['alice'] },
				wrapper: appRoot()
					.withEndpoint('GET', '/v1/chat.getMessage', getMessage)
					.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
					.build(),
			},
		);

		await waitFor(() => expect(result.current.data).toBeDefined());
		rerender({ revision: ['alice'] });

		expect(getMessage).toHaveBeenCalledTimes(1);
	});
	describe('the tooltip of a reaction', () => {
		const reaction = (names: string[]) => ({ usernames: names.map((name) => name.toLowerCase()), names });
		const reacted = (reactions: Record<string, { usernames: string[]; names?: string[] }>) =>
			createFakeMessage({ _id: 'reacted', reactions });
		const hoverTooltip = async (index: number) => {
			await userEvent.hover(screen.getAllByRole('button', { name: 'React_with__reaction__' })[index]);
		};
		const rootWith = (getMessage: jest.Mock, showRealName = true) =>
			appRoot()
				.withSetting('UI_Use_Real_Name', showRealName)
				.withTranslations('en', 'core', { Users_reacted_with: '{{users}} reacted with {{emoji}}' })
				.withEndpoint('GET', '/v1/chat.getMessage', getMessage)
				.wrap((children: ReactNode) => (
					<TooltipProvider>
						<MessagesProvider>{children}</MessagesProvider>
					</TooltipProvider>
				))
				.build();

		it('names the same person on the second emoji they reacted with after the first was shown (R14)', async () => {
			const getMessage = jest
				.fn()
				.mockResolvedValueOnce({ message: reacted({ ':smile:': reaction(['Alice A']) }) })
				.mockResolvedValueOnce({ message: reacted({ ':smile:': reaction(['Alice A']), ':tada:': reaction(['Alice A']) }) });
			const wrapper = rootWith(getMessage);

			const { rerender } = render(<MessageReactionList message={reacted({ ':smile:': { usernames: ['alice'] } })} />, { wrapper });
			await hoverTooltip(0);
			expect(await screen.findByText('Alice A reacted with :smile:')).toBeInTheDocument();
			await userEvent.unhover(screen.getAllByRole('button', { name: 'React_with__reaction__' })[0]);

			rerender(<MessageReactionList message={reacted({ ':smile:': { usernames: ['alice'] }, ':tada:': { usernames: ['alice'] } })} />);
			await hoverTooltip(1);

			expect(await screen.findByText('Alice A reacted with :tada:')).toBeInTheDocument();
		});

		it('stops naming someone who removed their reaction (R14)', async () => {
			const getMessage = jest
				.fn()
				.mockResolvedValueOnce({ message: reacted({ ':smile:': reaction(['Alice A', 'Bob B']) }) })
				.mockResolvedValueOnce({ message: reacted({ ':smile:': reaction(['Alice A']) }) });
			const wrapper = rootWith(getMessage);

			const { rerender } = render(<MessageReactionList message={reacted({ ':smile:': { usernames: ['alice', 'bob'] } })} />, {
				wrapper,
			});
			await hoverTooltip(0);
			expect(await screen.findByText('Alice A, Bob B reacted with :smile:')).toBeInTheDocument();
			await userEvent.unhover(screen.getAllByRole('button', { name: 'React_with__reaction__' })[0]);

			rerender(<MessageReactionList message={reacted({ ':smile:': { usernames: ['alice'] } })} />);
			await hoverTooltip(0);

			expect(await screen.findByText('Alice A reacted with :smile:')).toBeInTheDocument();
		});

		it('fetches nothing when real names are off (R14)', async () => {
			const getMessage = jest.fn();
			const wrapper = rootWith(getMessage, false);

			render(<MessageReactionList message={reacted({ ':smile:': { usernames: ['alice'] } })} />, { wrapper });
			await hoverTooltip(0);

			expect(await screen.findByText('alice reacted with :smile:')).toBeInTheDocument();
			expect(getMessage).not.toHaveBeenCalled();
		});
	});
});

describe('the message a thread started with (message-variants R49)', () => {
	afterEach(() => Messages.state.replaceAll([]));

	it('answers it from the store without a request (message-variants R49)', async () => {
		const main = createFakeMessage({ _id: 'thread-main', msg: 'the thread' });
		Messages.state.store(main);
		const getMessages = jest.fn();

		const { result } = renderHook(() => useMessageRelatedData().useParentMessage('thread-main'), {
			wrapper: appRoot()
				.withEndpoint('POST', '/v1/chat.getMessages', getMessages)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		await waitFor(() => expect(result.current.data).toEqual(main));
		expect(getMessages).not.toHaveBeenCalled();
	});
});

describe('renderers', () => {
	it('gives the message components the markdown, preview, UiKit and emoji components of the app (R30)', () => {
		const { result } = renderHook(() => useMessageRenderers(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		expect(Object.keys(result.current).sort()).toEqual(['Emoji', 'Markup', 'PreviewMarkup', 'UiKitMessageBlock']);
		expect(result.current.Markup).not.toBe(messageRenderersDefaultValue.Markup);
		expect(result.current.Emoji).not.toBe(messageRenderersDefaultValue.Emoji);
	});
});

type TestServiceWorker = { controller?: { postMessage: (message: { id: string; url: string }) => void }; addEventListener: jest.Mock };

const serviceWorker = navigator.serviceWorker as unknown as TestServiceWorker;

// The download module listens for the service worker's answers as soon as it loads.
const answerListeners = serviceWorker.addEventListener.mock.calls.map(([, listener]) => listener as (event: { data: unknown }) => void);

describe('media', () => {
	const player = (overrides: Partial<MediaPlayerContextValue> = {}): MediaPlayerContextValue => ({
		track: null,
		playing: false,
		currentTime: 0,
		duration: 0,
		playbackRate: 1,
		play: jest.fn(),
		toggle: jest.fn(),
		seek: jest.fn(),
		cyclePlaybackRate: jest.fn(),
		close: jest.fn(),
		isActive: () => false,
		...overrides,
	});

	const renderMedia = (value: MediaPlayerContextValue = player()) =>
		renderHook(() => useMessageMedia(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => (
					<MediaPlayerContext.Provider value={value}>
						<MessagesProvider>{children}</MessagesProvider>
					</MediaPlayerContext.Provider>
				))
				.build(),
		});

	afterEach(() => {
		delete serviceWorker.controller;
		delete window.RocketChatDesktop;
	});

	it('gives attachments the shared player of the app, also to a provider mounted later (message-attachments R14)', () => {
		const shared = player();
		const { result: firstResult } = renderMedia(shared);
		const { result: secondResult } = renderMedia(shared);

		secondResult.current.player.getSnapshot().play({ id: 'm:/audio.mp3', url: '/audio.mp3', title: 'audio.mp3' });

		expect(firstResult.current.player.getSnapshot()).toBe(shared);
		expect(secondResult.current.player.getSnapshot()).toBe(shared);
		expect(shared.play).toHaveBeenCalledWith({ id: 'm:/audio.mp3', url: '/audio.mp3', title: 'audio.mp3' });
	});

	it('downloads an encrypted file through the service worker every time (message-attachments R15)', () => {
		const posted: { id: string; url: string }[] = [];
		serviceWorker.controller = { postMessage: (message) => posted.push(message) };
		const answer = (id: string) =>
			answerListeners.forEach((listener) => listener({ data: { type: 'attachment-download-result', id, result: new ArrayBuffer(1) } }));
		mockDownloadAs.mockClear();
		const { result } = renderMedia();

		for (const activation of [1, 2]) {
			act(() => result.current.downloadEncrypted('/file-decrypt/id/a.txt', 'a.txt'));
			expect(posted).toHaveLength(activation);
			expect(posted[activation - 1].url).toBe('/file-decrypt/id/a.txt');
			act(() => answer(posted[activation - 1].id));
			expect(mockDownloadAs).toHaveBeenCalledTimes(activation);
		}
		expect(mockDownloadAs).toHaveBeenLastCalledWith(expect.anything(), 'a.txt');
	});

	it('allows encrypted downloads only under a service worker (message-attachments R16)', () => {
		expect(renderMedia().result.current.canDownloadEncrypted).toBe(false);

		serviceWorker.controller = { postMessage: jest.fn() };

		expect(renderMedia().result.current.canDownloadEncrypted).toBe(true);
	});

	it('enables encrypted downloads for the buttons that render after a service worker takes control (message-attachments R16)', () => {
		const { result } = renderMedia();

		expect(result.current.canDownloadEncrypted).toBe(false);

		serviceWorker.controller = { postMessage: jest.fn() };

		expect(result.current.canDownloadEncrypted).toBe(true);
	});

	it('offers the desktop document viewer only in the desktop app (message-attachments R17)', () => {
		expect(renderMedia().result.current.documentViewer).toBeUndefined();

		const openDocumentViewer = jest.fn();
		window.RocketChatDesktop = { openDocumentViewer, supportedDocumentViewerFormats: () => ['markdown'] } as never;
		const { documentViewer } = renderMedia().result.current;

		expect(documentViewer?.supportedFormats).toEqual(['markdown']);

		documentViewer?.open('/file.pdf', 'PDF');
		documentViewer?.open('/blob', 'PDF', 'Report');

		expect(openDocumentViewer).toHaveBeenCalledWith('/file.pdf', 'PDF', '');
		expect(openDocumentViewer).toHaveBeenCalledWith('/blob', 'PDF', 'Report');
	});

	describe('opens an encrypted PDF', () => {
		const originalFetch = global.fetch;
		const originalCreate = URL.createObjectURL;
		const originalRevoke = URL.revokeObjectURL;
		const revoke = jest.fn();

		beforeEach(() => {
			global.fetch = jest.fn(async () => ({ ok: true, blob: async () => new Blob(['pdf']) })) as never;
			URL.createObjectURL = jest.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
			URL.revokeObjectURL = revoke;
			revoke.mockClear();
		});

		afterEach(() => {
			global.fetch = originalFetch;
			URL.createObjectURL = originalCreate;
			URL.revokeObjectURL = originalRevoke;
		});

		it('in the viewer with the attachment title, keeping the blob of the other files (message-attachments R18)', async () => {
			const openDocumentViewer = jest.fn();
			window.RocketChatDesktop = { openDocumentViewer } as never;
			const { result } = renderMedia();

			await act(async () => {
				await result.current.openEncryptedPdf('/file-decrypt/a.pdf', { title: 'A', size: 1024, format: 'PDF' });
				await result.current.openEncryptedPdf('/file-decrypt/b.pdf', { title: 'B', size: 1024, format: 'PDF' });
			});

			expect(openDocumentViewer).toHaveBeenCalledWith('blob:first', 'PDF', 'A');
			expect(openDocumentViewer).toHaveBeenCalledWith('blob:second', 'PDF', 'B');
			expect(revoke).not.toHaveBeenCalled();
		});

		it('by downloading it when there is no viewer (message-attachments R17)', async () => {
			const posted: { id: string; url: string }[] = [];
			serviceWorker.controller = { postMessage: (message) => posted.push(message) };
			const { result } = renderMedia();

			await act(async () => {
				await result.current.openEncryptedPdf('/file-decrypt/a.pdf', { title: 'A', size: 1024, format: 'PDF' });
			});

			expect(posted.map(({ url }) => url)).toEqual(['/file-decrypt/a.pdf']);
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('saves each of two downloads that are pending together once, with its own content under its own title (message-attachments R18)', async () => {
			const posted: { id: string; url: string }[] = [];
			serviceWorker.controller = { postMessage: (message) => posted.push(message) };
			const answer = (id: string, bytes: number) =>
				answerListeners.forEach((listener) =>
					listener({ data: { type: 'attachment-download-result', id, result: new ArrayBuffer(bytes) } }),
				);
			window.RocketChatDesktop = { openDocumentViewer: jest.fn() } as never;
			mockDownloadAs.mockClear();
			const { result } = renderMedia();
			const tooLarge = 11 * 1024 * 1024;

			await act(async () => {
				await result.current.openEncryptedPdf('/file-decrypt/a.pdf', { title: 'A', size: tooLarge, format: 'PDF' });
				await result.current.openEncryptedPdf('/file-decrypt/b.pdf', { title: 'B', size: tooLarge, format: 'PDF' });
			});
			act(() => answer(posted[0].id, 1));
			act(() => answer(posted[1].id, 2));

			expect(mockDownloadAs.mock.calls.map(([{ data }, title]) => [data[0].size, title])).toEqual([
				[1, 'A'],
				[2, 'B'],
			]);
		});

		it('by downloading a file over the size limit or of unknown size (message-attachments R18)', async () => {
			const posted: { id: string; url: string }[] = [];
			serviceWorker.controller = { postMessage: (message) => posted.push(message) };
			window.RocketChatDesktop = { openDocumentViewer: jest.fn() } as never;
			const { result } = renderMedia();

			await act(async () => {
				await result.current.openEncryptedPdf('/file-decrypt/big.pdf', { title: 'Big', size: 11 * 1024 * 1024, format: 'PDF' });
				await result.current.openEncryptedPdf('/file-decrypt/unknown.pdf', { title: 'Unknown', format: 'PDF' });
			});

			expect(posted.map(({ url }) => url)).toEqual(['/file-decrypt/big.pdf', '/file-decrypt/unknown.pdf']);
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});

	it('formats file sizes like the rest of the app (message-attachments R19)', () => {
		expect(renderMedia().result.current.formatFileSize(2048)).toMatch(/2(\.00)? kB/);
		expect(renderMedia().result.current.formatFileSize(5 * 1024 * 1024)).toMatch(/5(\.00)? MB/);
	});

	describe('the player', () => {
		const file = { type: 'file', title: 'report.txt', title_link: '/report.txt', format: 'TXT' } as MessageAttachmentBase;

		const Root = appRoot()
			.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
			.build();

		const Harness = ({ value, children }: { value: MediaPlayerContextValue; children: ReactNode }) => (
			<MediaPlayerContext.Provider value={value}>
				<Root>{children}</Root>
			</MediaPlayerContext.Provider>
		);

		it('reaches the readers of the shared player with its changes (message-attachments R20)', () => {
			// One mounted provider across the change: the store has to take the new player, not start from it.
			const Reader = () => {
				const { currentTime, playing } = useMessageMediaPlayer();
				return <>{`${currentTime}:${playing}`}</>;
			};
			const { rerender } = render(
				<Harness value={player({ currentTime: 1 })}>
					<Reader />
				</Harness>,
			);

			expect(screen.getByText('1:false')).toBeInTheDocument();

			rerender(
				<Harness value={player({ currentTime: 2, playing: true })}>
					<Reader />
				</Harness>,
			);

			expect(screen.getByText('2:true')).toBeInTheDocument();
		});

		it('does not render an attachment that is not audio again when the player progresses (message-attachments R20)', () => {
			const rendered = jest.fn();
			// Draws the description of the attachment, so it renders whenever the attachment does.
			const Description = ({ content }: { content: string }) => {
				rendered();
				return <>{content}</>;
			};
			// Created once, as the list creates the rows, so only a change of what the attachment reads renders it again.
			const attachment = (
				<MarkdownTextContext.Provider value={Description}>
					<MessageAttachments attachments={[{ ...file, description: 'the description' }]} />
				</MarkdownTextContext.Provider>
			);
			const { rerender } = render(<Harness value={player({ currentTime: 1 })}>{attachment}</Harness>);
			const rendersBefore = rendered.mock.calls.length;

			expect(rendersBefore).toBeGreaterThan(0);

			rerender(<Harness value={player({ currentTime: 2, playing: true })}>{attachment}</Harness>);
			rerender(<Harness value={player({ currentTime: 3, playing: true })}>{attachment}</Harness>);

			expect(rendered).toHaveBeenCalledTimes(rendersBefore);
		});
	});
});

describe('the roles of the authors of a place (message-variants R49, R52)', () => {
	const room = createFakeRoom({ _id: 'room-roles' });

	const role = (_id: string, description: string) => ({
		_id,
		name: _id,
		description,
		scope: 'Users' as const,
		protected: false,
		_updatedAt: new Date(),
	});

	beforeEach(() => {
		Roles.state.replaceAll([role('admin', 'Administrator'), role('owner', 'Owner')]);
	});

	const renderRoles = (root: ReturnType<typeof appRoot>, rid: string) =>
		renderHook(() => useMessageRelatedData().usePlaceUserRoles('author-id', rid), {
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider room={room}>{children}</MessagesProvider>).build(),
		});

	it("answers the roles of the place's room from one resolution and leaves another room to the header (message-variants R49)", async () => {
		const getUserRoles = jest.fn(() => ({ users: [{ _id: 'author-id', username: 'author', roles: ['admin'] }] }));
		const getRoomRoles = jest.fn(() => ({ roles: [{ rid: room._id, u: { _id: 'author-id', username: 'author' }, roles: ['owner'] }] }));
		const root = appRoot()
			.withEndpoint('GET', '/v1/roles.getUsersInPublicRoles', getUserRoles)
			.withEndpoint('GET', '/v1/rooms.roles', getRoomRoles);

		const { result } = renderRoles(root, room._id);

		await waitFor(() => expect(result.current).toEqual({ workspaceRoles: ['Administrator'], roomRoles: ['Owner'] }));
		expect(renderRoles(root, 'another-room').result.current).toBeUndefined();
	});

	it('leaves no roles and raises no error when they cannot be fetched (message-variants R52)', async () => {
		const forbidden = jest.fn(() => {
			throw new Error('error-not-allowed');
		});
		const root = appRoot()
			.withEndpoint('GET', '/v1/roles.getUsersInPublicRoles', () => ({ users: [] }))
			.withEndpoint('GET', '/v1/rooms.roles', forbidden);

		const { result } = renderRoles(root, room._id);

		await waitFor(() => expect(forbidden).toHaveBeenCalled());
		expect(result.current).toEqual({ workspaceRoles: [], roomRoles: [] });
	});

	it('requests no roles while roles are hidden (message-variants R49)', async () => {
		const getRoomRoles = jest.fn(() => ({ roles: [] }));
		const root = appRoot().withSetting('UI_DisplayRoles', false).withEndpoint('GET', '/v1/rooms.roles', getRoomRoles);

		const { result } = renderRoles(root, room._id);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(result.current).toBeUndefined();
		expect(getRoomRoles).not.toHaveBeenCalled();
	});
});

describe('the message with the editing look (thread-message-list R46)', () => {
	afterEach(() => clearEditingMessage());

	const renderEditing = (allowsInteraction: boolean) =>
		renderHook(() => useIsMessageBeingEdited('message-id'), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider allowsInteraction={allowsInteraction}>{children}</MessagesProvider>)
				.build(),
		});

	it('is the message being edited, and follows it where interaction is allowed (thread-message-list R46)', () => {
		const { result } = renderEditing(true);
		expect(result.current).toBe(false);

		act(() => setEditingMessage('message-id'));
		expect(result.current).toBe(true);

		act(() => setEditingMessage('another-message'));
		expect(result.current).toBe(false);

		act(() => setEditingMessage('message-id'));
		act(() => clearEditingMessage());
		expect(result.current).toBe(false);
	});

	it('is no message where interaction is not allowed (thread-message-list R46)', () => {
		const { result } = renderEditing(false);

		act(() => setEditingMessage('message-id'));

		expect(result.current).toBe(false);
	});
});

describe('the conversation of a message (message-variants R49)', () => {
	afterEach(() => {
		Rooms.state.replaceAll([]);
		Subscriptions.state.replaceAll([]);
	});

	const message = createFakeMessage({ rid: 'room-a' });

	const renderConversation = (provider: { room?: ReturnType<typeof createFakeRoom>; subscription?: ISubscription }, enabled = true) =>
		renderHook(() => useMessageRelatedData().useConversation(message, { enabled }), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider {...provider}>{children}</MessagesProvider>)
				.build(),
		});

	it("answers the place's room and subscription for a message of the place's room, with no request (message-variants R49)", () => {
		const room = createFakeRoom({ _id: 'room-a' });
		const subscription = createFakeSubscription({ rid: 'room-a' });
		Subscriptions.state.store(createFakeSubscription({ rid: 'room-a', name: 'stored' }));

		const { result } = renderConversation({ room, subscription });

		expect(result.current).toEqual({ data: { room, subscription }, isLoading: false, isError: false });
	});

	it("answers the stores' room and subscription for a message of another room (message-variants R49)", () => {
		const room = createFakeRoom({ _id: 'room-a' });
		const subscription = createFakeSubscription({ rid: 'room-a' });
		Rooms.state.store(room);
		Subscriptions.state.store(subscription);

		const { result } = renderConversation({});

		expect(result.current.data).toEqual({ room, subscription });
	});

	it('answers nothing while it is not asked for (message-variants R49)', () => {
		Rooms.state.store(createFakeRoom({ _id: 'room-a' }));

		const { result } = renderConversation({}, false);

		expect(result.current.data).toBeUndefined();
	});
});
