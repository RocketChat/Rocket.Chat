import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { sendMessage } from './sendMessage';
import { Messages, Rooms, Subscriptions } from '../../../stores';
import { createGoldenChat, resetStores, trackMessagesStore } from '../goldenChat';
import { NOW, behavior, clearCalls, getCalls, modalProps, resetFakes, resetRandom } from '../goldenFakes';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../slashCommand', () => jest.requireActual('../goldenFakes').slashCommandModule);
jest.mock('../../emoji', () => jest.requireActual('../goldenFakes').emojiModule);
jest.mock('../../rooms/roomCoordinator', () => jest.requireActual('../goldenFakes').roomCoordinatorModule);
jest.mock('../../../../lib/i18n', () => jest.requireActual('../goldenFakes').i18nModule);
jest.mock('@rocket.chat/random', () => jest.requireActual('../goldenFakes').randomModule);
jest.mock('@rocket.chat/ui-client', () => jest.requireActual('../goldenFakes').imperativeModalModule);
jest.mock('../../onClientBeforeSendMessage', () => jest.requireActual('../goldenFakes').onClientBeforeSendMessageModule);
jest.mock('../../onClientMessageReceived', () => jest.requireActual('../goldenFakes').onClientMessageReceivedModule);
jest.mock('./afterSendMessageCallback', () => jest.requireActual('../goldenFakes').afterSendMessageCallbackModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);
jest.mock('../../e2ee/rocketchat.e2e', () => jest.requireActual('../goldenFakes').e2eModule);

const user = { _id: 'uid1', username: 'john.doe', name: 'John Doe' };

const room = { _id: 'GENERAL', t: 'c', name: 'general' } as IRoom;
const subscription = { _id: 'sub-1', rid: 'GENERAL', t: 'c', u: { _id: 'uid1', username: 'john.doe' } } as SubscriptionWithRoom;

const original = {
	_id: 'm1',
	rid: 'GENERAL',
	msg: 'old text',
	ts: new Date('2026-11-27T09:00:00.000Z'),
	u: user,
	_updatedAt: new Date('2026-11-27T09:00:00.000Z'),
} as IMessage;

const optimistic = (message: object, extra: object = {}) => ({ ...message, ts: NOW, u: user, temp: true, ...extra });
const committed = (message: object, extra: object = {}) => ({ ...message, ts: NOW, u: user, ...extra });

// Everything sendMessage does before and around composing: join check, unread mark, mid and files probes.
const entry = [
	['chat.data.isSubscribedToRoom'],
	['chat.readStateManager.clearUnreadMark'],
	['chat.currentEditingMessage.getMID'],
	['chat.composer.uploads.get'],
	['chat.composer.quotedMessages.get'],
];

const compose = (text: string, options: object) => [
	'chat.data.composeMessage',
	text,
	{ quotedMessages: [], originalMessage: null, ...options },
];

const sent = (message: object, { previewUrls, extra }: { previewUrls?: string[]; extra?: object } = {}) => [
	['onClientBeforeSendMessage', { ...message, isEditing: false }],
	['chat.currentEditingMessage.getMID'],
	['chat.composer.clear'],
	['getUserId'],
	['getUser'],
	['settings.peek', 'Message_Read_Receipt_Enabled'],
	['onClientMessageReceived', optimistic(message, extra)],
	['Messages.store', optimistic(message, extra)],
	['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls }],
	['Messages.store', committed(message, extra)],
];

const stored = () => [...Messages.state.records.values()];

const modalOpened = async () => {
	for (let i = 0; i < 50 && !modalProps.current; i++) {
		await Promise.resolve();
	}
};

let stopTracking: () => void;

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
	resetFakes();
	resetRandom();
	resetStores();
	modalProps.current = undefined;
	Rooms.state.store(room);
	Subscriptions.state.store(subscription);
	stopTracking = trackMessagesStore();
});

afterEach(() => {
	stopTracking();
	jest.useRealTimers();
});

describe('sendMessage golden: plain text', () => {
	it('sends hello: composes, clears, stores an optimistic copy, posts, then drops the temp flag', async () => {
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };

		await expect(sendMessage(chat, { text: 'hello' })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			...entry,
			compose('hello', {}),
			['chat.composer.dismissAllQuotedMessages'],
			['chat.currentEditingMessage.getMID'],
			['settings.peek', 'Message_MaxAllowedSize'],
			['chat.composer.uploads.get'],
			...sent(message),
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
		expect(stored()).toEqual([committed(message)]);
	});

	it('trims the text and closes an unclosed code fence before composing', async () => {
		const chat = createGoldenChat();

		await sendMessage(chat, { text: '  ```js\nlet a = 1  ' });

		expect(getCalls()[5]).toEqual(compose('```js\nlet a = 1\n```', {}));
		expect(stored()).toEqual([committed({ _id: 'random-1', rid: 'GENERAL', msg: '```js\nlet a = 1\n```' })]);
	});

	it.each([
		['mentions and channels', '@rocket.cat look at #general and @all', '@rocket.cat look at #general and @all'],
		['unicode', 'café 日本語 👨‍👩‍👧', 'café 日本語 👨‍👩‍👧'],
		['surrounding whitespace and inner newlines', '\n a\n\nb \t', 'a\n\nb'],
		['a closed fence', '```\nx\n```', '```\nx\n```'],
		['two fences, one unclosed', '```a``` ```b', '```a``` ```b\n```'],
	])('passes %s through untouched apart from trim and fence closing', async (_name, text, msg) => {
		const chat = createGoldenChat();

		await sendMessage(chat, { text });

		expect(getCalls()).toContainEqual([
			'sdk.rest.post',
			'/v1/chat.sendMessage',
			{ message: { _id: 'random-1', rid: 'GENERAL', msg }, previewUrls: undefined },
		]);
	});

	it('forwards previewUrls to the request', async () => {
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'see https://a.test' };

		await sendMessage(chat, { text: 'see https://a.test', previewUrls: ['https://a.test'] });

		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: ['https://a.test'] }]);
	});
});

describe('sendMessage golden: nothing to send', () => {
	it('returns false for an empty string after the unread mark and the probes, touching nothing else', async () => {
		const chat = createGoldenChat();

		await expect(sendMessage(chat, { text: '' })).resolves.toBe(false);

		expect(getCalls()).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.readStateManager.clearUnreadMark'],
			['chat.currentEditingMessage.getMID'],
			['chat.composer.uploads.get'],
		]);
		expect(stored()).toEqual([]);
	});

	it('treats whitespace only like an empty string', async () => {
		const chat = createGoldenChat();

		await expect(sendMessage(chat, { text: ' \n\t ' })).resolves.toBe(false);

		expect(getCalls()).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.readStateManager.clearUnreadMark'],
			['chat.currentEditingMessage.getMID'],
			['chat.composer.uploads.get'],
		]);
	});

	it('works without a composer: no quotes, no clear, no uploads', async () => {
		const chat = createGoldenChat({ withComposer: false });
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };

		await expect(sendMessage(chat, { text: 'hello' })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.readStateManager.clearUnreadMark'],
			['chat.currentEditingMessage.getMID'],
			compose('hello', {}),
			['chat.currentEditingMessage.getMID'],
			['settings.peek', 'Message_MaxAllowedSize'],
			['onClientBeforeSendMessage', { ...message, isEditing: false }],
			['chat.currentEditingMessage.getMID'],
			['getUserId'],
			['getUser'],
			['settings.peek', 'Message_Read_Receipt_Enabled'],
			['onClientMessageReceived', optimistic(message)],
			['Messages.store', optimistic(message)],
			['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }],
			['Messages.store', committed(message)],
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
	});
});

describe('sendMessage golden: room membership', () => {
	it('joins the room first when there is no subscription, then sends', async () => {
		Subscriptions.useStore.setState({ records: new Map() });
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };

		await expect(sendMessage(chat, { text: 'hello' })).resolves.toBe(true);

		expect(getCalls().slice(0, 4)).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.data.joinRoom'],
			['sdk.rest.post', '/v1/rooms.join', { roomId: 'GENERAL' }],
			['chat.readStateManager.clearUnreadMark'],
		]);
		expect(stored()).toEqual([committed(message)]);
	});

	it('toasts the error and stops with false when joining fails', async () => {
		Subscriptions.useStore.setState({ records: new Map() });
		const failure = new Error('error-not-allowed');
		behavior.post = async () => {
			throw failure;
		};
		const chat = createGoldenChat();

		await expect(sendMessage(chat, { text: 'hello' })).resolves.toBe(false);

		expect(getCalls()).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.data.joinRoom'],
			['sdk.rest.post', '/v1/rooms.join', { roomId: 'GENERAL' }],
			['toast', { type: 'error', message: failure }],
		]);
		expect(stored()).toEqual([]);
	});
});

describe('sendMessage golden: quotes and threads', () => {
	it('prepends one permalink line per quoted message, in the order they were quoted', async () => {
		const chat = createGoldenChat({ quoted: [{ _id: 'q1' } as IMessage, { _id: 'q2' } as IMessage] });
		const message = { _id: 'random-1', rid: 'GENERAL', msg: '[ ](/permalink/q1)\n[ ](/permalink/q2)\nhello' };

		await sendMessage(chat, { text: 'hello' });

		expect(getCalls().slice(0, 12)).toEqual([
			...entry,
			['chat.data.composeMessage', 'hello', { quotedMessages: [{ _id: 'q1' }, { _id: 'q2' }], originalMessage: null }],
			['getPermaLink', 'q1'],
			['getPermaLink', 'q2'],
			['chat.composer.dismissAllQuotedMessages'],
			['chat.currentEditingMessage.getMID'],
			['settings.peek', 'Message_MaxAllowedSize'],
			['chat.composer.uploads.get'],
		]);
		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }]);
		expect(stored()).toEqual([committed(message)]);
	});

	it('keeps the quotes in the composed text when the request fails', async () => {
		behavior.post = async () => {
			throw new Error('boom');
		};
		const chat = createGoldenChat({ quoted: [{ _id: 'q1' } as IMessage] });

		await sendMessage(chat, { text: 'hello' });

		const calls = getCalls();
		expect(calls.findIndex(([fn]) => fn === 'chat.composer.dismissAllQuotedMessages')).toBeGreaterThan(-1);
		expect(calls.at(-1)).toEqual(['toast', { type: 'error', message: new Error('boom') }]);
	});

	it('adds tmid to the message and upserts the thread cache after the optimistic store', async () => {
		const chat = createGoldenChat({ tmid: 'thread-1' });
		const message = { _id: 'random-1', rid: 'GENERAL', tmid: 'thread-1', msg: 'in thread' };

		await sendMessage(chat, { text: 'in thread' });

		const calls = getCalls();
		expect(calls).toContainEqual(compose('in thread', {}));
		const storeAt = calls.findIndex(([fn]) => fn === 'Messages.store');
		expect(calls.slice(storeAt - 1, storeAt + 3)).toEqual([
			['onClientMessageReceived', optimistic(message)],
			['Messages.store', optimistic(message)],
			['upsertThreadMessageInCache', optimistic(message), 'GENERAL', 'thread-1'],
			['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }],
		]);
		expect(stored()).toEqual([committed(message)]);
	});

	it('adds tshow next to tmid when sending to the channel', async () => {
		const chat = createGoldenChat({ tmid: 'thread-1' });
		const message = { _id: 'random-1', rid: 'GENERAL', tmid: 'thread-1', tshow: true, msg: 'also in channel' };

		await sendMessage(chat, { text: 'also in channel', tshow: true });

		expect(getCalls()).toContainEqual(compose('also in channel', { sendToChannel: true }));
		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }]);
	});

	it('ignores tshow outside a thread', async () => {
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'no thread' };

		await sendMessage(chat, { text: 'no thread', tshow: true });

		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }]);
	});

	it('leaves tshow out when it is false', async () => {
		const chat = createGoldenChat({ tmid: 'thread-1' });
		const message = { _id: 'random-1', rid: 'GENERAL', tmid: 'thread-1', msg: 'thread only' };

		await sendMessage(chat, { text: 'thread only', tshow: false });

		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }]);
	});
});

describe('sendMessage golden: optimistic insert', () => {
	it('marks the optimistic message unread when read receipts are enabled', async () => {
		behavior.settings.Message_Read_Receipt_Enabled = true;
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };

		await sendMessage(chat, { text: 'hello' });

		expect(getCalls()).toContainEqual(['Messages.store', optimistic(message, { unread: true })]);
		expect(stored()).toEqual([committed(message, { unread: true })]);
	});

	it('skips the optimistic insert without a user id but still posts', async () => {
		behavior.userId = undefined;
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };

		await sendMessage(chat, { text: 'hello' });

		const calls = getCalls();
		expect(calls.slice(calls.findIndex(([fn]) => fn === 'chat.composer.clear'))).toEqual([
			['chat.composer.clear'],
			['getUserId'],
			['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }],
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
		expect(stored()).toEqual([]);
	});

	it('skips the optimistic insert when the user has no username but still posts', async () => {
		behavior.user = { _id: 'uid1' };
		const chat = createGoldenChat();

		await sendMessage(chat, { text: 'hello' });

		const calls = getCalls();
		expect(
			calls.slice(
				calls.findIndex(([fn]) => fn === 'getUserId'),
				calls.findIndex(([fn]) => fn === 'sdk.rest.post'),
			),
		).toEqual([['getUserId'], ['getUser']]);
		expect(stored()).toEqual([]);
	});

	it('skips the optimistic insert in a federated room but still posts', async () => {
		Rooms.state.store({ ...room, federated: true } as IRoom);
		const chat = createGoldenChat();

		await sendMessage(chat, { text: 'hello' });

		const calls = getCalls();
		expect(calls.map(([fn]) => fn)).not.toContain('onClientMessageReceived');
		expect(calls.map(([fn]) => fn)).toContain('sdk.rest.post');
		expect(stored()).toEqual([]);
	});

	it('toasts when the composed id is already in the store and still posts', async () => {
		const existing = { _id: 'dup', rid: 'GENERAL', msg: 'already here', ts: NOW, u: user } as IMessage;
		Messages.state.store(existing);
		behavior.beforeSendMessage = async (message) => ({ ...message, _id: 'dup' });
		const chat = createGoldenChat();

		await sendMessage(chat, { text: 'hello' });

		const calls = getCalls();
		const from = calls.findIndex(([fn]) => fn === 'getUserId');
		expect(calls.slice(from)).toEqual([
			['getUserId'],
			['toast', { type: 'error', message: 'Message_Already_Sent' }],
			['sdk.rest.post', '/v1/chat.sendMessage', { message: { _id: 'dup', rid: 'GENERAL', msg: 'hello' }, previewUrls: undefined }],
			['afterSendMessageCallback', { _id: 'random-1', rid: 'GENERAL', msg: 'hello' }, 'GENERAL'],
		]);
		expect(stored()).toEqual([existing]);
	});

	it('does not touch a record the stream replaced while the request was in flight', async () => {
		const streamed = { _id: 'random-1', rid: 'GENERAL', msg: 'hello', ts: NOW, u: user, unread: false } as IMessage;
		behavior.post = async () => {
			Messages.state.store(streamed);
			return {};
		};
		const chat = createGoldenChat();

		await sendMessage(chat, { text: 'hello' });

		expect(stored()).toEqual([streamed]);
		const storeCalls = getCalls().filter(([fn]) => fn === 'Messages.store');
		expect(storeCalls).toEqual([
			['Messages.store', optimistic({ _id: 'random-1', rid: 'GENERAL', msg: 'hello' })],
			['Messages.store', streamed],
		]);
	});
});

describe('sendMessage golden: outbound message identity', () => {
	it('posts what onClientBeforeSendMessage returned, minus e2e and isEditing, but reports the outer message to afterSendMessage', async () => {
		behavior.beforeSendMessage = async (message) => ({ ...message, msg: 'transformed', e2e: 'pending' }) as IMessage;
		const chat = createGoldenChat();
		const outer = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };
		const posted = { _id: 'random-1', rid: 'GENERAL', msg: 'transformed' };

		await sendMessage(chat, { text: 'hello' });

		const calls = getCalls();
		expect(calls).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message: posted, previewUrls: undefined }]);
		expect(calls).toContainEqual(['Messages.store', optimistic(posted)]);
		expect(calls.at(-1)).toEqual(['afterSendMessageCallback', outer, 'GENERAL']);
		expect(stored()).toEqual([committed(posted)]);
	});

	it('reports a transform failure with a toast, leaves the composer, and skips the after-send callback', async () => {
		const failure = new Error('encryption failed');
		behavior.beforeSendMessage = async () => {
			throw failure;
		};
		const chat = createGoldenChat();

		await expect(sendMessage(chat, { text: 'hello' })).resolves.toBe(true);

		expect(getCalls().slice(-2)).toEqual([
			['onClientBeforeSendMessage', { _id: 'random-1', rid: 'GENERAL', msg: 'hello', isEditing: false }],
			['toast', { type: 'error', message: failure }],
		]);
		expect(stored()).toEqual([]);
	});

	it('keeps the temp record, toasts, and skips the after-send callback when the request fails', async () => {
		const failure = new Error('error-network');
		behavior.post = async () => {
			throw failure;
		};
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'hello' };

		await expect(sendMessage(chat, { text: 'hello' })).resolves.toBe(true);

		expect(getCalls().slice(-3)).toEqual([
			['Messages.store', optimistic(message)],
			['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }],
			['toast', { type: 'error', message: failure }],
		]);
		expect(stored()).toEqual([optimistic(message)]);
	});
});

describe('sendMessage golden: edit mode', () => {
	beforeEach(() => {
		Messages.state.store(original);
		clearCalls();
	});

	it('updates the original instead of posting: compose with the original, rewrite through chat.update', async () => {
		const chat = createGoldenChat({ editingMid: 'm1' });
		const message = { _id: 'm1', rid: 'GENERAL', msg: 'new text' };

		await expect(sendMessage(chat, { text: 'new text' })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.readStateManager.clearUnreadMark'],
			['chat.currentEditingMessage.getMID'],
			['chat.composer.uploads.get'],
			['chat.composer.quotedMessages.get'],
			['chat.data.findMessageByID', 'm1'],
			['chat.data.composeMessage', 'new text', { quotedMessages: [], originalMessage: original }],
			['chat.data.findMessageByID', 'm1'],
			['chat.composer.dismissAllQuotedMessages'],
			['chat.currentEditingMessage.getMID'],
			['settings.peek', 'Message_MaxAllowedSize'],
			['chat.composer.uploads.get'],
			['onClientBeforeSendMessage', { ...message, isEditing: true }],
			['chat.currentEditingMessage.getMID'],
			['chat.composer.clear'],
			['chat.data.updateMessage', message, undefined],
			[
				'sdk.rest.post',
				'/v1/chat.update',
				{ msgId: 'm1', roomId: 'GENERAL', text: 'new text', previewUrls: undefined, customFields: undefined },
			],
			['chat.currentEditingMessage.stop'],
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
		expect(stored()).toEqual([original]);
	});

	it('passes previewUrls to chat.update', async () => {
		const chat = createGoldenChat({ editingMid: 'm1' });

		await sendMessage(chat, { text: 'new text', previewUrls: ['https://a.test'] });

		expect(getCalls()).toContainEqual([
			'sdk.rest.post',
			'/v1/chat.update',
			{ msgId: 'm1', roomId: 'GENERAL', text: 'new text', previewUrls: ['https://a.test'] },
		]);
	});

	it('toasts and still stops editing when chat.update fails', async () => {
		const failure = new Error('error-message-not-found');
		behavior.post = async () => {
			throw failure;
		};
		const chat = createGoldenChat({ editingMid: 'm1' });

		await expect(sendMessage(chat, { text: 'new text' })).resolves.toBe(true);

		expect(getCalls().slice(-4)).toEqual([
			['sdk.rest.post', '/v1/chat.update', { msgId: 'm1', roomId: 'GENERAL', text: 'new text' }],
			['toast', { type: 'error', message: failure }],
			['chat.currentEditingMessage.stop'],
			['afterSendMessageCallback', { _id: 'm1', rid: 'GENERAL', msg: 'new text' }, 'GENERAL'],
		]);
	});

	it('keeps the original thread and room, not the ones the data API was built for', async () => {
		Messages.state.store({ ...original, _id: 'm2', rid: 'OTHER', tmid: 'thread-9' } as IMessage);
		const chat = createGoldenChat({ editingMid: 'm2' });

		await sendMessage(chat, { text: 'edited', tshow: true });

		expect(getCalls()).toContainEqual([
			'chat.data.updateMessage',
			{ _id: 'm2', rid: 'OTHER', tmid: 'thread-9', tshow: true, msg: 'edited' },
			undefined,
		]);
	});

	it('carries an encrypted original attachments and file onto the edit', async () => {
		const attachments = [{ title: 'a.png', type: 'file' }];
		const file = { _id: 'f1', name: 'a.png' };
		Messages.state.store({ ...original, _id: 'm3', t: 'e2e', attachments, file } as IMessage);
		const chat = createGoldenChat({ editingMid: 'm3' });
		const message = { _id: 'm3', rid: 'GENERAL', msg: 'caption', attachments, file };

		await sendMessage(chat, { text: 'caption' });

		expect(getCalls()).toContainEqual(['onClientBeforeSendMessage', { ...message, isEditing: true }]);
		expect(getCalls()).toContainEqual(['chat.data.updateMessage', message, undefined]);
	});

	it('does not carry attachments of an encrypted original that has none', async () => {
		Messages.state.store({ ...original, _id: 'm4', t: 'e2e', attachments: [] } as IMessage);
		const chat = createGoldenChat({ editingMid: 'm4' });

		await sendMessage(chat, { text: 'caption' });

		expect(getCalls()).toContainEqual(['onClientBeforeSendMessage', { _id: 'm4', rid: 'GENERAL', msg: 'caption', isEditing: true }]);
	});

	it('with no text and no files, deletes the original when nothing editable is left', async () => {
		const chat = createGoldenChat({ editingMid: 'm1' });

		await expect(sendMessage(chat, { text: '   ' })).resolves.toBe(false);

		expect(getCalls()).toEqual([
			['chat.data.isSubscribedToRoom'],
			['chat.readStateManager.clearUnreadMark'],
			['chat.currentEditingMessage.getMID'],
			['chat.composer.uploads.get'],
			['chat.data.findMessageByID', 'm1'],
			['chat.flows.processMessageEditing', { ...original, msg: '' }, undefined],
			['chat.currentEditingMessage.getMID'],
			['chat.currentEditingMessage.reset'],
			['chat.flows.requestMessageDeletion', original],
		]);
	});

	it('with no text, keeps the message when it still has attachments: updates with an empty text and stops editing twice', async () => {
		const withAttachment = { ...original, attachments: [{ title: 'a.png' }] } as IMessage;
		Messages.state.store(withAttachment);
		const chat = createGoldenChat({ editingMid: 'm1' });

		await expect(sendMessage(chat, { text: '' })).resolves.toBe(false);

		expect(getCalls().slice(5)).toEqual([
			['chat.data.findMessageByID', 'm1'],
			['chat.flows.processMessageEditing', { ...withAttachment, msg: '' }, undefined],
			['chat.currentEditingMessage.getMID'],
			['chat.composer.clear'],
			['chat.data.updateMessage', { ...withAttachment, msg: '', _id: 'm1' }, undefined],
			['sdk.rest.post', '/v1/chat.update', { msgId: 'm1', roomId: 'GENERAL', text: '', previewUrls: undefined, customFields: undefined }],
			['chat.currentEditingMessage.stop'],
			['chat.currentEditingMessage.stop'],
		]);
	});

	it('warns and returns false when the original is not found', async () => {
		const chat = createGoldenChat({ editingMid: 'gone', dataOverrides: { findMessageByID: async () => null } });

		await expect(sendMessage(chat, { text: '' })).resolves.toBe(false);

		expect(getCalls().slice(-2)).toEqual([
			['chat.data.findMessageByID', 'gone'],
			['toast', { type: 'warning', message: 'Message_not_found' }],
		]);
	});

	it('rejects (outside the try) when the lookup of the original itself fails', async () => {
		const failure = new Error('error-invalid-params');
		behavior.get = async () => {
			throw failure;
		};
		const chat = createGoldenChat({ editingMid: 'gone' });

		await expect(sendMessage(chat, { text: '' })).rejects.toBe(failure);

		expect(getCalls().slice(-2)).toEqual([
			['chat.data.findMessageByID', 'gone'],
			['sdk.rest.get', '/v1/chat.getMessage', { msgId: 'gone' }],
		]);
	});
});

describe('sendMessage golden: sub-flows that end the send', () => {
	it('does not run the slash flow unless it is allowed: the text goes out as a message', async () => {
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: '/help' };

		await sendMessage(chat, { text: '/help' });

		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }]);
	});

	it('ends in the slash flow for an unrecognized command and still runs the after-send callback', async () => {
		const chat = createGoldenChat();
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const message = { _id: 'random-1', rid: 'GENERAL', msg: '/nope arg' };
		const ephemeral = {
			_id: 'random-2',
			ts: NOW,
			msg: 'No_such_command {"command":"nope"}',
			u: { _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket.Cat' },
			private: true,
			_updatedAt: NOW,
		};

		await expect(sendMessage(chat, { text: '/nope arg', isSlashCommandAllowed: true })).resolves.toBe(true);

		expect(getCalls().slice(8)).toEqual([
			['settings.peek', 'Message_MaxAllowedSize'],
			['settings.peek', 'Message_AllowUnrecognizedSlashCommand'],
			['chat.composer.clear'],
			['chat.data.pushEphemeralMessage', ephemeral],
			['Messages.store', { ...ephemeral, rid: 'GENERAL' }],
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
		expect(stored()).toEqual([{ ...ephemeral, rid: 'GENERAL' }]);
	});

	it('sends an unrecognized command as a message when the setting allows it', async () => {
		behavior.settings.Message_AllowUnrecognizedSlashCommand = true;
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: '/nope arg' };

		await sendMessage(chat, { text: '/nope arg', isSlashCommandAllowed: true });

		expect(getCalls()).toContainEqual(['sdk.rest.post', '/v1/chat.sendMessage', { message, previewUrls: undefined }]);
	});

	it('reacts to the last message for +:emoji: and does not post a message', async () => {
		behavior.emojis = { ':smile:': {} };
		const last = { ...original, _id: 'last', ts: new Date('2026-11-27T09:30:00.000Z') } as IMessage;
		Messages.state.store(last);
		Subscriptions.state.store(subscription);
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: '+:smile:' };

		await expect(sendMessage(chat, { text: '+:smile:' })).resolves.toBe(true);

		const calls = getCalls();
		expect(calls).toContainEqual(['sdk.rest.post', '/v1/chat.react', { emoji: ':smile:', messageId: 'last' }]);
		expect(calls.map(([fn]) => fn)).not.toContain('onClientBeforeSendMessage');
		expect(calls.at(-1)).toEqual(['afterSendMessageCallback', message, 'GENERAL']);
	});

	it('toasts, restores the text and posts nothing when the message is too long and attachments are off', async () => {
		behavior.settings.Message_MaxAllowedSize = 5;
		behavior.settings.Message_AllowConvertLongMessagesToAttachment = false;
		const chat = createGoldenChat();
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'way too long' };

		await expect(sendMessage(chat, { text: 'way too long' })).resolves.toBe(true);

		expect(getCalls().slice(6)).toEqual([
			['chat.composer.dismissAllQuotedMessages'],
			['chat.currentEditingMessage.getMID'],
			['settings.peek', 'Message_MaxAllowedSize'],
			['settings.peek', 'FileUpload_Enabled'],
			['settings.peek', 'Message_AllowConvertLongMessagesToAttachment'],
			['chat.currentEditingMessage.getMID'],
			['toast', { type: 'error', message: new Error('Message_too_long') }],
			['chat.composer.setText', 'way too long'],
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
	});

	it('offers an attachment for a long message and uploads it on confirm', async () => {
		behavior.settings.Message_MaxAllowedSize = 5;
		const chat = createGoldenChat();

		const sending = sendMessage(chat, { text: 'way too long' });
		await modalOpened();
		expect(getCalls().at(-1)?.[0]).toBe('imperativeModal.open');
		await (modalProps.current?.onConfirm as () => Promise<void>)();
		await expect(sending).resolves.toBe(true);

		const names = getCalls().map(([fn]) => fn);
		expect(names.slice(names.indexOf('imperativeModal.open'))).toEqual([
			'imperativeModal.open',
			'getUser',
			'chat.composer.clear',
			'imperativeModal.close',
			'chat.flows.uploadFiles',
			'afterSendMessageCallback',
		]);
		expect(stored()).toEqual([]);
	});

	it('leaves everything in place when the attachment offer is declined', async () => {
		behavior.settings.Message_MaxAllowedSize = 5;
		const chat = createGoldenChat();

		const sending = sendMessage(chat, { text: 'way too long' });
		await modalOpened();
		(modalProps.current?.onClose as () => void)();
		await expect(sending).resolves.toBe(true);

		const names = getCalls().map(([fn]) => fn);
		expect(names.slice(names.indexOf('imperativeModal.open'))).toEqual([
			'imperativeModal.open',
			'imperativeModal.close',
			'afterSendMessageCallback',
		]);
		expect(stored()).toEqual([]);
	});
});

describe('sendMessage golden: files in the composer', () => {
	const upload = {
		id: 'file-1',
		file: new File(['x'], 'a.txt', { type: 'text/plain' }),
		url: '/file-upload/file-1/a.txt',
		percentage: 100,
	};

	it('confirms the upload with the text instead of posting a message, then clears the composer', async () => {
		const chat = createGoldenChat({ uploads: [upload] });
		const message = { _id: 'random-1', rid: 'GENERAL', msg: 'caption' };

		await expect(sendMessage(chat, { text: 'caption' })).resolves.toBe(true);

		const calls = getCalls();
		expect(calls.slice(calls.findIndex(([fn]) => fn === 'chat.composer.dismissAllQuotedMessages'))).toEqual([
			['chat.composer.dismissAllQuotedMessages'],
			['chat.currentEditingMessage.getMID'],
			['settings.peek', 'Message_MaxAllowedSize'],
			['chat.composer.uploads.get'],
			['e2e.getInstanceByRoomId', 'GENERAL'],
			['chat.composer.uploads.get'],
			['chat.composer.uploads.setProcessingUploads', true],
			['sdk.rest.post', '/v1/rooms.mediaConfirm/GENERAL/file-1', { msg: 'caption', fileName: 'a.txt', description: undefined }],
			['chat.composer.uploads.removeUpload', 'file-1'],
			['chat.composer.uploads.setProcessingUploads', false],
			['chat.composer.clear'],
			['afterSendMessageCallback', message, 'GENERAL'],
		]);
		expect(stored()).toEqual([]);
	});

	it('sends the files alone when the text is empty', async () => {
		const chat = createGoldenChat({ uploads: [upload] });

		await expect(sendMessage(chat, { text: '' })).resolves.toBe(true);

		expect(getCalls()).toContainEqual([
			'sdk.rest.post',
			'/v1/rooms.mediaConfirm/GENERAL/file-1',
			{ msg: '', fileName: 'a.txt', description: undefined },
		]);
	});
});
