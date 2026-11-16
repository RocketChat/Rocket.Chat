import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext, ModalContext } from '@rocket.chat/ui-contexts';
import { EmojiPickerContext, usePreviewEmoji } from '@rocket.chat/ui-emoji-picker';
import {
	MessageToolbarHolder,
	useMessageContent,
	useMessageDisplay,
	useMessageInteractions,
	useMessageMedia,
	useMessageNavigation,
	useMessageRelatedData,
	useMessageRenderers,
	useMessageToolbar,
} from '@rocket.chat/ui-message-list';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ComponentProps, ContextType, ReactNode } from 'react';

import MessagesProvider from './MessagesProvider';
import { useMessageToolbarValue } from './useMessageToolbarValue';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';
import type { ChatAPI } from '../../lib/chats/ChatAPI';
import { Messages, Rooms, Subscriptions } from '../../stores';
import { ChatContext } from '../../views/room/contexts/ChatContext';
import { RoomContext } from '../../views/room/contexts/RoomContext';

jest.mock('../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../lib/autotranslate', () => ({ AutoTranslate: { getLanguage: () => 'pt', messageIdsToWait: {} } }));
jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		isLivechatRoom: () => false,
		readOnly: (room: IRoom, user?: { username?: string }) => {
			if (!user?.username) {
				return Boolean(room.ro);
			}
			if (room.muted?.includes(user.username)) {
				return true;
			}
			return Boolean(room.ro) && !room.unmuted?.includes(user.username);
		},
	},
}));

type Context = NonNullable<ComponentProps<typeof MessageToolbarHolder>['context']>;

const room = createFakeRoom({ _id: 'rid', t: 'c' }) as IRoom;
const subscription = createFakeSubscription({ rid: 'rid', t: 'c', autoTranslate: true, autoTranslateLanguage: 'pt' }) as ISubscription;

const chatOf = (inRoom: IRoom) =>
	({
		data: {
			findRoom: async () => inRoom,
			findSubscription: async () => subscription,
			canDeleteMessage: async () => true,
		},
		composer: { quoteMessage: jest.fn() },
		messageEditing: { editMessage: jest.fn() },
		flows: { requestMessageDeletion: jest.fn() },
		emojiPicker: { open: jest.fn() },
	}) as unknown as ChatAPI;

const chat = chatOf(room);

const permissions = [
	'pin-message',
	'start-discussion',
	'start-discussion-other-user',
	'edit-message',
	'delete-message',
	'auto-translate',
	'create-d',
];

const everything = () =>
	permissions
		.reduce((root, permission) => root.withPermission(permission), mockAppRoot().withJohnDoe())
		.withSubscription({ ...subscription, rid: 'rid' } as never)
		.withSetting('Message_AllowPinning', true)
		.withSetting('Message_AllowStarring', true)
		.withSetting('Threads_enabled', true)
		.withSetting('Discussion_enabled', true)
		.withSetting('AutoTranslate_Enabled', true)
		.withSetting('Message_AllowEditing', true)
		.withSetting('Message_Read_Receipt_Enabled', true)
		.withSetting('Message_Read_Receipt_Store_Users', true);

const picker = {
	quickReactions: ['+1', 'smile', 'tada', 'rocket'].map((emoji) => ({ emoji, image: '<span class="emoji"></span>' })),
	addRecentEmoji: jest.fn(),
	addFrequentEmoji: jest.fn(),
} as unknown as NonNullable<ContextType<typeof EmojiPickerContext>>;

const renderToolbar = (
	root: ReturnType<typeof everything>,
	message: IMessage,
	context?: Context,
	{ withPicker = true, inRoom = room }: { withPicker?: boolean; inRoom?: IRoom } = {},
) => {
	Rooms.state.store(inRoom);
	Subscriptions.state.store({ ...subscription, rid: inRoom._id } as never);

	return render(<MessageToolbarHolder message={message} context={context} />, {
		wrapper: root
			.wrap((children: ReactNode) => (
				<EmojiPickerContext.Provider value={withPicker ? picker : undefined}>
					<ChatContext.Provider value={chatOf(inRoom)}>
						<RoomContext.Provider value={{ rid: inRoom._id, room: inRoom, subscribed: true }}>
							<MessagesProvider room={inRoom} subscription={subscription}>
								{children}
							</MessagesProvider>
						</RoomContext.Provider>
					</ChatContext.Provider>
				</EmojiPickerContext.Provider>
			))
			.build(),
	});
};

const openMenu = async (root: ReturnType<typeof everything>, message: IMessage, context?: Context, inRoom = room) => {
	renderToolbar(root, message, context, { inRoom });

	await userEvent.click(await screen.findByRole('button', { name: 'More' }));

	return screen.getAllByRole('menuitem').map((item) => (item.textContent ?? '').replace(/^[^A-Za-z]+/, ''));
};

const inlineButtons = async () => {
	const toolbar = await screen.findByRole('toolbar', { name: 'Message_actions' });
	return within(toolbar)
		.getAllByRole('button')
		.map((button) => button.getAttribute('aria-label') ?? button.getAttribute('title'));
};

beforeAll(() => {
	window.DISABLE_ANIMATION = true;
	global.IntersectionObserver = class {
		observe = jest.fn();

		disconnect = jest.fn();
	} as never;
});

const ofSomeoneElse = createFakeMessage({ _id: 'mid', rid: 'rid', u: { _id: 'someone', username: 'someone' } });
const ofTheViewer = createFakeMessage({
	_id: 'mid',
	rid: 'rid',
	u: { _id: 'john.doe', username: 'john.doe' },
	pinned: true,
	starred: [{ _id: 'john.doe' }],
	replies: ['john.doe'],
	reactions: { ':tada:': { usernames: ['someone'] } },
});

describe('the menu of each place', () => {
	const channelMessage = [
		'Reply_in_direct_message',
		'Discussion_start',
		'Follow_message',
		'Pin',
		'Star',
		'Mark_unread',
		'Translate',
		'Copy_link',
		'Copy_text',
		'Read_Receipts',
		'Edit',
		'Report',
		'Delete',
	];

	// What the toolbar of the app listed before the package drew it, for a viewer who may do everything.
	it.each<[Context | undefined, string[]]>([
		['message', channelMessage],
		['message-mobile', channelMessage],
		[
			'threads',
			[
				'Reply_in_direct_message',
				'Follow_message',
				'Pin',
				'Star',
				'Mark_unread',
				'Translate',
				'Copy_link',
				'Copy_text',
				'Read_Receipts',
				'Edit',
				'Report',
				'Delete',
			],
		],
		['pinned', ['Pin', 'Copy_link']],
		['starred', ['Star', 'Copy_link', 'Read_Receipts']],
		['direct', ['Pin']],
		[
			'federated',
			[
				'Reply_in_direct_message',
				'Follow_message',
				'Star',
				'Mark_unread',
				'Copy_link',
				'Copy_text',
				'Read_Receipts',
				'Edit',
				'Report',
				'Delete',
			],
		],
		['videoconf', ['Discussion_start', 'Follow_message', 'Pin', 'Star', 'Copy_link', 'Read_Receipts', 'Report', 'Delete']],
		['videoconf-threads', ['Follow_message', 'Pin', 'Star', 'Copy_link', 'Read_Receipts', 'Report', 'Delete']],
	])('offers the entries of the %s place for a message of someone else, in order (R19)', async (context, expected) => {
		expect(await openMenu(everything(), ofSomeoneElse, context)).toEqual(expected);
	});

	it('offers the entries of the place it infers when it is given none (R19)', async () => {
		expect(await openMenu(everything(), ofSomeoneElse)).toEqual(channelMessage);
	});

	const ownMessage = [
		'Reply_in_direct_message',
		'Discussion_start',
		'Unfollow_message',
		'Unpin',
		'Unstar_Message',
		'Reactions',
		'Copy_link',
		'Copy_text',
		'Read_Receipts',
		'Edit',
		'Delete',
	];

	it.each<[Context | undefined, string[]]>([
		['message', ownMessage],
		['message-mobile', ownMessage],
		[
			'threads',
			[
				'Reply_in_direct_message',
				'Unfollow_message',
				'Unpin',
				'Unstar_Message',
				'Reactions',
				'Copy_link',
				'Copy_text',
				'Read_Receipts',
				'Edit',
				'Delete',
			],
		],
		['pinned', ['Unpin', 'Copy_link']],
		['starred', ['Unstar_Message', 'Copy_link', 'Read_Receipts']],
		['direct', ['Unpin']],
		[
			'federated',
			[
				'Reply_in_direct_message',
				'Unfollow_message',
				'Unstar_Message',
				'Reactions',
				'Copy_link',
				'Copy_text',
				'Read_Receipts',
				'Edit',
				'Delete',
			],
		],
		['videoconf', ['Discussion_start', 'Unfollow_message', 'Unpin', 'Unstar_Message', 'Reactions', 'Copy_link', 'Read_Receipts', 'Delete']],
		['videoconf-threads', ['Unfollow_message', 'Unpin', 'Unstar_Message', 'Reactions', 'Copy_link', 'Read_Receipts', 'Delete']],
	])('offers the entries of the %s place for a pinned, starred and followed message of the viewer (R19)', async (context, expected) => {
		expect(await openMenu(everything(), ofTheViewer, context)).toEqual(expected);
	});

	it.each<Context>(['mentions', 'search'])('has no menu in the %s place (R19)', async (context) => {
		renderToolbar(everything(), ofSomeoneElse, context);

		expect(await inlineButtons()).toEqual(['Jump_to_message']);
	});

	it.each<[string, Partial<IRoom>]>([
		['a read-only room', { ro: true }],
		['a room where the viewer is muted', { muted: ['john.doe'] }],
	])('offers the same entries in %s, which only take the reactions away (R19)', async (_name, overrides) => {
		const restricted = { ...room, ...overrides } as IRoom;

		renderToolbar(everything(), ofSomeoneElse, 'message', { inRoom: restricted });

		expect(await inlineButtons()).toEqual(['Quote', 'Reply_in_thread', 'Forward_message', 'More']);

		await userEvent.click(screen.getByRole('button', { name: 'More' }));

		expect(screen.getAllByRole('menuitem').map((item) => (item.textContent ?? '').replace(/^[^A-Za-z]+/, ''))).toEqual(channelMessage);
	});

	it('hides the read receipts without the setting that stores who read (R19)', async () => {
		const items = await openMenu(everything().withSetting('Message_Read_Receipt_Store_Users', false), ofSomeoneElse, 'starred');

		expect(items).toEqual(['Star', 'Copy_link']);
	});

	it('does not offer a discussion to someone outside the parent room (R19)', async () => {
		const root = permissions
			.reduce((r, permission) => r.withPermission(permission), mockAppRoot().withJohnDoe())
			.withSetting('Discussion_enabled', true);

		expect(await openMenu(root as ReturnType<typeof everything>, ofSomeoneElse, 'videoconf')).not.toContain('Discussion_start');
	});
});

describe('the actions of apps', () => {
	const button = (overrides: Record<string, unknown>) => ({
		appId: 'app',
		labelI18n: 'App_action',
		context: 'messageAction',
		actionId: 'action',
		...overrides,
	});

	const withApps = (buttons: unknown[]) => everything().withEndpoint('GET', '/apps/actionButtons', () => buttons as never);

	it('come last, in a section of their own, and AI actions have a menu apart (R20)', async () => {
		const root = withApps([button({ actionId: 'one' }), button({ actionId: 'ai', category: 'ai', labelI18n: 'Ai_action' })]);

		renderToolbar(root, ofSomeoneElse, 'starred');
		await userEvent.click(await screen.findByRole('button', { name: 'More' }));
		expect(await screen.findByText('Apps')).toBeInTheDocument();

		const items = screen.getAllByRole('menuitem');
		expect(items.map((item) => item.textContent)).toEqual([
			expect.stringContaining('Star'),
			expect.stringContaining('Copy_link'),
			expect.stringContaining('Read_Receipts'),
			expect.stringContaining('app'),
		]);
		expect(screen.getByText('Apps')).toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: /Ai_action/ })).not.toBeInTheDocument();

		await userEvent.keyboard('{Escape}');
		await userEvent.click(await screen.findByRole('button', { name: 'AI_Actions', hidden: true }));

		expect(await screen.findByRole('menuitem', { name: /Ai_action/ })).toBeInTheDocument();
	});

	it('show a menu that holds only them, where the layout hides every built-in entry (R14)', async () => {
		const hidden = {
			hiddenActions: {
				messageToolbox: ['permalink', 'star-message', 'mark-message-as-unread', 'copy', 'report-message', 'delete-message'],
				roomToolbox: [],
			},
		} as never;
		const root = mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/apps/actionButtons', () => [button({})] as never)
			.wrap((children: ReactNode) => <LayoutContext.Provider value={hidden}>{children}</LayoutContext.Provider>);

		renderToolbar(root as never, ofSomeoneElse, 'threads');
		await userEvent.click(await screen.findByRole('button', { name: 'More' }));

		expect(await screen.findByText('Apps')).toBeInTheDocument();
		expect(screen.getAllByRole('menuitem')).toHaveLength(1);
	});
});

describe('the quick reactions', () => {
	it('are the first three of the emoji picker (R21)', async () => {
		renderToolbar(everything(), ofSomeoneElse, 'message');

		expect(await inlineButtons()).toEqual(['+1', 'smile', 'tada', 'Add_Reaction', 'Quote', 'Reply_in_thread', 'Forward_message', 'More']);
	});

	it('are none where the app has no emoji picker (R21)', async () => {
		renderToolbar(everything(), ofSomeoneElse, 'message', { withPicker: false });

		expect(await inlineButtons()).toEqual(['Add_Reaction', 'Quote', 'Reply_in_thread', 'Forward_message', 'More']);
	});

	it('are left out when the app cannot render the emoji (R21)', async () => {
		const quickReactions = [{ emoji: 'ghost', image: '' }, ...picker.quickReactions];
		const unrenderable = { ...picker, quickReactions } as typeof picker;

		render(<MessageToolbarHolder message={ofSomeoneElse} context='message' />, {
			wrapper: everything()
				.wrap((children: ReactNode) => (
					<EmojiPickerContext.Provider value={unrenderable}>
						<ChatContext.Provider value={chat}>
							<RoomContext.Provider value={{ rid: room._id, room, subscribed: true }}>
								<MessagesProvider room={room} subscription={subscription}>
									{children}
								</MessagesProvider>
							</RoomContext.Provider>
						</ChatContext.Provider>
					</EmojiPickerContext.Provider>
				))
				.build(),
		});

		expect((await inlineButtons()).slice(0, 3)).toEqual(['+1', 'smile', 'Add_Reaction']);
	});

	it('react, count toward the frequent emoji and are not added to the recent ones (R21)', async () => {
		const react = jest.fn().mockResolvedValue({ success: true });
		picker.addRecentEmoji = jest.fn();
		picker.addFrequentEmoji = jest.fn();

		renderToolbar(everything().withEndpoint('POST', '/v1/chat.react', react), ofSomeoneElse, 'message');
		await userEvent.click(await screen.findByRole('button', { name: 'smile' }));

		await waitFor(() => expect(react).toHaveBeenCalledWith({ messageId: 'mid', reaction: ':smile:' }));
		expect(picker.addFrequentEmoji).toHaveBeenCalledWith('smile');
		expect(picker.addFrequentEmoji).toHaveBeenCalledTimes(1);
		expect(picker.addRecentEmoji).not.toHaveBeenCalled();
	});

	it('say that the place offers no reactions where no chat is open (R21)', () => {
		const quickReactionsWith = (chatValue: ChatAPI | undefined) =>
			renderHook(() => useMessageToolbar().useQuickReactions(), {
				wrapper: everything()
					.wrap((children: ReactNode) => (
						<EmojiPickerContext.Provider value={picker}>
							<ChatContext.Provider value={chatValue}>
								<MessagesProvider room={room} subscription={subscription}>
									{children}
								</MessagesProvider>
							</ChatContext.Provider>
						</EmojiPickerContext.Provider>
					))
					.build(),
			}).result.current;

		expect(quickReactionsWith(undefined)).toBeUndefined();
		expect(quickReactionsWith(chat)).toEqual(['+1', 'smile', 'tada']);
	});

	it('are not counted by the reaction that opens the picker (R21)', async () => {
		picker.addFrequentEmoji = jest.fn();

		renderToolbar(everything(), ofSomeoneElse, 'message');
		await userEvent.click(await screen.findByRole('button', { name: 'Add_Reaction' }));

		expect(picker.addFrequentEmoji).not.toHaveBeenCalled();
	});
});

describe('the value of the toolbar', () => {
	const readReceipts = { enabled: true, storeUsers: true };

	it('keeps its identity while the read receipt settings and the quick reactions stay the same (R22)', () => {
		const { result, rerender } = renderHook(({ receipts }) => useMessageToolbarValue({ readReceipts: receipts }, chat), {
			initialProps: { receipts: readReceipts },
		});
		const first = result.current;

		rerender({ receipts: { ...readReceipts } });

		expect(result.current).toBe(first);

		rerender({ receipts: { enabled: false, storeUsers: true } });

		expect(result.current).not.toBe(first);
	});

	it('keeps its identity when the emoji picker changes but its quick reactions do not (R22)', () => {
		const wrapper = ({ children }: { children: ReactNode }) => (
			<EmojiPickerContext.Provider value={{ ...picker }}>{children}</EmojiPickerContext.Provider>
		);
		const { result, rerender } = renderHook(() => useMessageToolbarValue({ readReceipts }, chat), { wrapper });
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});

	it('keeps every value the provider gives while the emoji picker previews an emoji (R22)', () => {
		let preview: (emoji: { emoji: string; name: string } | null) => void = () => undefined;
		const Picker = ({ children }: { children: ReactNode }) => {
			const [emojiToPreview, setEmojiToPreview] = useState<{ emoji: string; name: string } | null>(null);
			preview = setEmojiToPreview;

			return <EmojiPickerContext.Provider value={{ ...picker, emojiToPreview }}>{children}</EmojiPickerContext.Provider>;
		};
		const wrapper = everything()
			.wrap((children: ReactNode) => (
				<Picker>
					<ChatContext.Provider value={chat}>
						<RoomContext.Provider value={{ rid: room._id, room, subscribed: true }}>
							<MessagesProvider room={room} subscription={subscription}>
								{children}
							</MessagesProvider>
						</RoomContext.Provider>
					</ChatContext.Provider>
				</Picker>
			))
			.build();
		const { result } = renderHook(
			() => ({
				previewed: usePreviewEmoji().emojiToPreview,
				display: useMessageDisplay(),
				navigation: useMessageNavigation(),
				interactions: useMessageInteractions(),
				toolbar: useMessageToolbar(),
				relatedData: useMessageRelatedData(),
				content: useMessageContent(),
				media: useMessageMedia(),
				renderers: useMessageRenderers(),
			}),
			{ wrapper },
		);
		const before = result.current;

		act(() => preview({ emoji: 'image://smile', name: 'smile' }));

		expect(result.current.previewed).toEqual({ emoji: 'image://smile', name: 'smile' });
		const { previewed: _before, ...valuesBefore } = before;
		const { previewed: _after, ...valuesAfter } = result.current;
		for (const key of Object.keys(valuesBefore) as (keyof typeof valuesBefore)[]) {
			expect(valuesAfter[key]).toBe(valuesBefore[key]);
		}
	});

	it('changes when the quick reactions do (R22)', () => {
		let { quickReactions } = picker;
		const wrapper = ({ children }: { children: ReactNode }) => (
			<EmojiPickerContext.Provider value={{ ...picker, quickReactions }}>{children}</EmojiPickerContext.Provider>
		);
		const { result, rerender } = renderHook(() => useMessageToolbarValue({ readReceipts }, chat), { wrapper });
		const first = result.current;
		expect(result.current.useQuickReactions()).toEqual(['+1', 'smile', 'tada']);

		quickReactions = [{ emoji: 'rocket', image: '<span></span>' }];
		rerender();

		expect(result.current).not.toBe(first);
		expect(result.current.useQuickReactions()).toEqual(['rocket']);
	});
});

describe('the actions on a message from the menu', () => {
	beforeEach(() => {
		Messages.state.store(ofSomeoneElse);
		Messages.state.store(ofTheViewer);
	});

	afterEach(() => {
		Messages.state.replaceAll([]);
	});

	const choose = async (root: ReturnType<typeof everything>, message: IMessage, entry: RegExp, context: Context = 'message') => {
		renderToolbar(root, message, context);
		await userEvent.click(await screen.findByRole('button', { name: 'More' }));
		await userEvent.click(await screen.findByRole('menuitem', { name: entry }));
	};

	const endpoint = () => jest.fn().mockResolvedValue({ success: true });

	it('stars through the REST API (R24)', async () => {
		const star = endpoint();

		await choose(everything().withEndpoint('POST', '/v1/chat.starMessage', star), ofSomeoneElse, /^Star$/);

		await waitFor(() => expect(star).toHaveBeenCalledWith({ messageId: 'mid' }));
	});

	it('unstars through the REST API (R24)', async () => {
		const unstar = endpoint();

		await choose(everything().withEndpoint('POST', '/v1/chat.unStarMessage', unstar), ofTheViewer, /Unstar_Message/);

		await waitFor(() => expect(unstar).toHaveBeenCalledWith({ messageId: 'mid' }));
	});

	it('unpins through the REST API (R24)', async () => {
		const unpin = endpoint();

		await choose(everything().withEndpoint('POST', '/v1/chat.unPinMessage', unpin), ofTheViewer, /Unpin/);

		await waitFor(() => expect(unpin).toHaveBeenCalledWith({ messageId: 'mid' }));
	});

	it('pins through the REST API once the viewer confirms (R24)', async () => {
		const pin = endpoint();
		const setModal = jest.fn();
		const root = everything()
			.withEndpoint('POST', '/v1/chat.pinMessage', pin)
			.wrap((children: ReactNode) => (
				<ModalContext.Provider value={{ modal: { setModal }, currentModal: { component: null } } as never}>
					{children}
				</ModalContext.Provider>
			));

		await choose(root as never, ofSomeoneElse, /^Pin$/);
		expect(pin).not.toHaveBeenCalled();

		render(setModal.mock.calls[0][0], { wrapper: everything().withEndpoint('POST', '/v1/chat.pinMessage', pin).build() });
		await userEvent.click(await screen.findByRole('button', { name: 'Yes_pin_message' }));

		await waitFor(() => expect(pin).toHaveBeenCalledWith({ messageId: 'mid' }));
	});

	it('marks a message unread through the REST API (R24)', async () => {
		const unread = endpoint();
		const navigate = jest.fn();

		await choose(
			everything().withEndpoint('POST', '/v1/subscriptions.unread', unread).withRouter({ navigate }),
			ofSomeoneElse,
			/Mark_unread/,
		);

		await waitFor(() => expect(unread).toHaveBeenCalledWith({ firstUnreadMessage: { _id: 'mid' } }));
	});

	it('translates a message through the REST API (R24)', async () => {
		const translate = endpoint();

		await choose(everything().withEndpoint('POST', '/v1/autotranslate.translateMessage', translate), ofSomeoneElse, /Translate/);

		await waitFor(() => expect(translate).toHaveBeenCalledWith({ messageId: 'mid', targetLanguage: 'pt' }));
	});
});
