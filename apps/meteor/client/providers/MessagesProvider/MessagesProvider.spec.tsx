import type { IMessage, ISubscription, MessageAttachment } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { TooltipProvider } from '@rocket.chat/ui-client';
import { ModalContext } from '@rocket.chat/ui-contexts';
import {
	MessageReactionList,
	useMessageContent,
	useMessageDisplay,
	useMessageInteractions,
	useMessageNavigation,
	useMessageRelatedData,
	useMessageRenderers,
	messageRenderersDefaultValue,
	useIsMessageSelected,
	useIsSelectingMessages,
} from '@rocket.chat/ui-message-list';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import MessagesProvider from './MessagesProvider';
import { messageSelectionFromStore } from './messageSelectionFromStore';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';
import { actionLinks } from '../../lib/actionLinks';
import type { ChatAPI } from '../../lib/chats/ChatAPI';
import { ChatContext } from '../../views/room/contexts/ChatContext';
import { SelectedMessageStore } from '../../views/room/providers/SelectedMessageStore';

jest.mock('../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../lib/autotranslate', () => ({ AutoTranslate: { getLanguage: () => 'pt', messageIdsToWait: {} } }));
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
