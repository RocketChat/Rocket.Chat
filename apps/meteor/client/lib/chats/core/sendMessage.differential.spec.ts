import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { sendMessageCore, type SendMessageDeps, type SendMessageParams } from './sendMessage';
import { t } from '../../../../lib/i18n';
import { trim } from '../../../../lib/utils/stringUtils';
import { Messages, Rooms, Subscriptions } from '../../../stores';
import { sdk } from '../../SDKClient';
import { onClientBeforeSendMessage } from '../../onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../onClientMessageReceived';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import { getUser, getUserId } from '../../user';
import { upsertThreadMessageInCache } from '../../utils/threadMessageUtils';
import type { ChatAPI } from '../ChatAPI';
import { afterSendMessageCallback } from '../flows/afterSendMessageCallback';
import { processMessageEditing } from '../flows/processMessageEditing';
import { processMessageUploads } from '../flows/processMessageUploads';
import { processSetReaction } from '../flows/processSetReaction';
import { processSlashCommand } from '../flows/processSlashCommand';
import { processTooLongMessage } from '../flows/processTooLongMessage';
import { sendMessage } from '../flows/sendMessage';
import { createGoldenChat, resetStores, trackMessagesStore } from '../goldenChat';
import {
	NOW,
	afterSendMessageCallbackModule,
	behavior,
	getCalls,
	modalProps,
	onClientMessageReceivedModule,
	record,
	resetFakes,
	resetRandom,
} from '../goldenFakes';
import { legacySendMessage } from '../legacySendMessageReference';

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
jest.mock('../flows/afterSendMessageCallback', () => jest.requireActual('../goldenFakes').afterSendMessageCallbackModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);
jest.mock('../../e2ee/rocketchat.e2e', () => jest.requireActual('../goldenFakes').e2eModule);

const author = { _id: 'uid1', username: 'john.doe', name: 'John Doe' };
const room = { _id: 'GENERAL', t: 'c', name: 'general' } as IRoom;
const subscription = { _id: 'sub-1', rid: 'GENERAL', t: 'c', u: { _id: 'uid1', username: 'john.doe' } } as SubscriptionWithRoom;
const original = {
	_id: 'm1',
	rid: 'GENERAL',
	msg: 'old text',
	ts: new Date('2026-11-27T09:00:00.000Z'),
	u: author,
	_updatedAt: new Date('2026-11-27T09:00:00.000Z'),
} as IMessage;
const lastMessage = { ...original, _id: 'last', ts: new Date('2026-11-27T09:30:00.000Z') } as IMessage;
const upload = { id: 'file-1', file: new File(['x'], 'a.txt', { type: 'text/plain' }), url: '/file-upload/file-1/a.txt', percentage: 100 };

const coreDeps = (): SendMessageDeps<ChatAPI> => ({
	getUserId: () => getUserId(),
	getUser: () => getUser(),
	trim: (text) => trim(text),
	getMessage: (id) => Messages.state.get(id),
	storeMessage: (message) => Messages.state.store(message),
	updateMessage: (predicate, modifier) => Messages.state.update(predicate, modifier),
	getRoom: (rid) => Rooms.state.get(rid),
	isReadReceiptEnabled: () => settings.peek('Message_Read_Receipt_Enabled'),
	onClientMessageReceived: (message) => onClientMessageReceived(message),
	onClientBeforeSendMessage: (message) => onClientBeforeSendMessage(message),
	upsertThreadMessage: (message, rid, tmid) => upsertThreadMessageInCache(message, rid, tmid),
	postMessage: (body) => sdk.rest.post('/v1/chat.sendMessage', body),
	afterSendMessage: (message, rid) => afterSendMessageCallback(message, rid),
	notifyError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	notifyAlreadySent: () => dispatchToastMessage({ type: 'error', message: t('Message_Already_Sent') }),
	notifyMessageNotFound: () => dispatchToastMessage({ type: 'warning', message: t('Message_not_found') }),
	flows: {
		processSetReaction: (target, message) => processSetReaction(target, message),
		processTooLongMessage: (target, message) => processTooLongMessage(target, message),
		processSlashCommand: (target, message) => processSlashCommand(target, message),
		processMessageUploads: (target, message) => processMessageUploads(target, message),
		processMessageEditing: (target, message, previewUrls) => processMessageEditing(target, message, previewUrls),
	},
});

type Chat = ReturnType<typeof createGoldenChat>;
type Runner = (chat: Chat, params: SendMessageParams) => Promise<boolean>;

const runners: Record<'legacy' | 'adapter' | 'core', Runner> = {
	legacy: legacySendMessage,
	adapter: sendMessage,
	core: (chat, params) => sendMessageCore(coreDeps(), chat, params),
};

type Step = 'onConfirm' | 'onClose';

type Case = {
	name: string;
	params?: unknown;
	chat?: Parameters<typeof createGoldenChat>[0];
	setup?: () => void;
	patch?: (chat: Chat) => void;
	script?: Step[];
};

const given = (patch: Partial<typeof behavior>) => () => {
	Object.assign(behavior, patch);
};
const post = (handler: (endpoint: string) => Promise<unknown>) => given({ post: handler });
const failOn = (endpoint: string, error: unknown) =>
	post(async (called) => {
		if (called === endpoint) {
			throw error;
		}
		return {};
	});
const text = (value: string, extra: object = {}): Pick<Case, 'params'> => ({ params: { text: value, ...extra } });
const seed =
	(...messages: IMessage[]) =>
	() => {
		for (const message of messages) {
			Messages.state.store(message);
		}
	};
const editing = (extra: Partial<Case> = {}): Partial<Case> => ({ chat: { editingMid: 'm1' }, ...extra, setup: seed(original) });
const setupBoth =
	(...fns: (() => void)[]) =>
	() => {
		for (const fn of fns) {
			fn();
		}
	};
const rejecting = (error: unknown) => async () => {
	throw error;
};

const cases: Case[] = [
	{ name: 'plain text', ...text('hello') },
	{ name: 'trims and closes an unclosed fence', ...text('  ```js\nlet a = 1  ') },
	{ name: 'a closed fence', ...text('```\nx\n```') },
	{ name: 'two fences, one unclosed', ...text('```a``` ```b') },
	{ name: 'mentions and channels', ...text('@rocket.cat look at #general and @all') },
	{ name: 'unicode', ...text('café 日本語 👨‍👩‍👧') },
	{ name: 'inner newlines and tabs', ...text('\n a\n\nb \t') },
	{ name: 'long text within the limit', ...text('x'.repeat(5000)) },
	{ name: 'previewUrls', ...text('see https://a.test', { previewUrls: ['https://a.test'] }) },
	{ name: 'empty previewUrls', ...text('hello', { previewUrls: [] }) },
	{ name: 'empty string', ...text('') },
	{ name: 'whitespace only', ...text(' \n\t ') },
	{ name: 'a fence of whitespace only closes into text', ...text('```') },
	{ name: 'no composer, empty', chat: { withComposer: false }, ...text('') },
	{ name: 'no composer', chat: { withComposer: false }, ...text('hello') },
	{ name: 'editing mid is an empty string', chat: { editingMid: '' }, ...text('hello') },
	{ name: 'text undefined rejects', params: { text: undefined } },
	{ name: 'text is a number rejects', params: { text: 5 } },
	{ name: 'params undefined', params: undefined },
	{ name: 'not subscribed: joins then sends', ...text('hello'), setup: () => Subscriptions.useStore.setState({ records: new Map() }) },
	{
		name: 'join fails with an error',
		...text('hello'),
		setup: setupBoth(
			() => Subscriptions.useStore.setState({ records: new Map() }),
			failOn('/v1/rooms.join', new Error('error-not-allowed')),
		),
	},
	{
		name: 'join fails with a non-error',
		...text('hello'),
		setup: setupBoth(() => Subscriptions.useStore.setState({ records: new Map() }), failOn('/v1/rooms.join', 'nope')),
	},
	{
		name: 'subscription lookup rejects',
		...text('hello'),
		chat: { dataOverrides: { isSubscribedToRoom: rejecting(new Error('lookup')) } },
	},
	{
		name: 'quotes: one permalink per quote in order',
		...text('hello'),
		chat: { quoted: [{ _id: 'q1' } as IMessage, { _id: 'q2' } as IMessage] },
	},
	{
		name: 'quotes kept when the request fails',
		...text('hello'),
		chat: { quoted: [{ _id: 'q1' } as IMessage] },
		setup: failOn('/v1/chat.sendMessage', new Error('boom')),
	},
	{
		name: 'quote permalink fails: compose rejects outside the try',
		...text('hello'),
		chat: { quoted: [{ _id: 'q1' } as IMessage] },
		setup: given({ permaLinkError: new Error('permalink boom') }),
	},
	{
		name: 'quote lookup throws',
		...text('hello'),
		patch: (chat) => void Object.assign(chat.composer ?? {}, { quotedMessages: { get: throwing('quotes boom') } }),
	},
	{ name: 'thread', ...text('in thread'), chat: { tmid: 'thread-1' } },
	{ name: 'thread with tshow', ...text('also in channel', { tshow: true }), chat: { tmid: 'thread-1' } },
	{ name: 'tshow outside a thread', ...text('no thread', { tshow: true }) },
	{ name: 'tshow false in a thread', ...text('thread only', { tshow: false }), chat: { tmid: 'thread-1' } },
	{ name: 'thread message received comes back without tmid', ...text('in thread'), chat: { tmid: 'thread-1' }, setup: stripTmid },
	{ name: 'receive transform adds a tmid', ...text('hello'), setup: addTmid },
	{ name: 'read receipts enabled', ...text('hello'), setup: setting('Message_Read_Receipt_Enabled', true) },
	{ name: 'read receipts is a truthy string', ...text('hello'), setup: setting('Message_Read_Receipt_Enabled', '0') },
	{ name: 'without a user id', ...text('hello'), setup: given({ userId: undefined }) },
	{ name: 'with an empty user id', ...text('hello'), setup: given({ userId: '' }) },
	{ name: 'without a user', ...text('hello'), setup: given({ user: undefined }) },
	{ name: 'user without a username', ...text('hello'), setup: given({ user: { _id: 'uid1' } }) },
	{ name: 'user with an empty username', ...text('hello'), setup: given({ user: { _id: 'uid1', username: '' } }) },
	{ name: 'user without a name', ...text('hello'), setup: given({ user: { _id: 'uid1', username: 'john.doe' } }) },
	{ name: 'federated room', ...text('hello'), setup: () => Rooms.state.store({ ...room, federated: true } as IRoom) },
	{ name: 'federated false', ...text('hello'), setup: () => Rooms.state.store({ ...room, federated: false } as IRoom) },
	{ name: 'room missing from the store', ...text('hello'), setup: () => Rooms.useStore.setState({ records: new Map() }) },
	{
		name: 'duplicate id: toast and still posts',
		...text('hello'),
		setup: seed({ _id: 'random-1', rid: 'GENERAL', msg: 'already', ts: NOW, u: author } as IMessage),
	},
	{
		name: 'the stream replaces the record while the request is in flight',
		...text('hello'),
		setup: post(async (endpoint) => {
			if (endpoint === '/v1/chat.sendMessage') {
				Messages.state.store({ _id: 'random-1', rid: 'GENERAL', msg: 'hello', ts: NOW, u: author, unread: false } as IMessage);
			}
			return {};
		}),
	},
	{
		name: 'the stream removes the record while the request is in flight',
		...text('hello'),
		setup: post(async (endpoint) => {
			if (endpoint === '/v1/chat.sendMessage') {
				Messages.state.delete('random-1');
			}
			return {};
		}),
	},
	{ name: 'receive transform rejects', ...text('hello'), setup: receiveRejects },
	{ name: 'receive transform returns another id', ...text('hello'), setup: receiveRenames },
	{ name: 'before-send transform rejects', ...text('hello'), setup: given({ beforeSendMessage: rejecting(new Error('transform boom')) }) },
	{
		name: 'before-send transform throws synchronously',
		...text('hello'),
		setup: given({
			beforeSendMessage: () => {
				throw new Error('sync transform');
			},
		}),
	},
	{
		name: 'before-send transform returns undefined',
		...text('hello'),
		setup: given({ beforeSendMessage: async () => undefined as unknown as IMessage }),
	},
	{
		name: 'before-send transform returns null',
		...text('hello'),
		setup: given({ beforeSendMessage: async () => null as unknown as IMessage }),
	},
	{
		name: 'before-send transform encrypts: e2e and isEditing are dropped, the outer message goes to the callback',
		...text('secret'),
		setup: given({
			beforeSendMessage: async (message) =>
				({ ...message, msg: '', t: 'e2e', e2e: 'pending', content: { algorithm: 'a', ciphertext: 'c' } }) as unknown as IMessage,
		}),
	},
	{
		name: 'before-send transform returns another id and msg',
		...text('hello'),
		setup: given({ beforeSendMessage: async (message) => ({ ...message, _id: 'other', msg: 'changed' }) }),
	},
	{
		name: 'before-send transform returns a blank msg: no optimistic insert',
		...text('hello'),
		setup: given({ beforeSendMessage: async (message) => ({ ...message, msg: '   ' }) }),
	},
	{
		name: 'before-send transform returns no msg: no optimistic insert',
		...text('hello'),
		setup: given({ beforeSendMessage: async ({ msg: _, ...message }) => message as IMessage }),
	},
	{
		name: 'before-send transform mutates the object it received',
		...text('hello'),
		setup: given({
			beforeSendMessage: async (message) => {
				Object.assign(message, { msg: 'mutated', e2e: 'x' });
				return message;
			},
		}),
	},
	{ name: 'request fails with an error', ...text('hello'), setup: failOn('/v1/chat.sendMessage', new Error('boom')) },
	{ name: 'request fails with a string', ...text('hello'), setup: failOn('/v1/chat.sendMessage', 'plain') },
	{
		name: 'request throws synchronously',
		...text('hello'),
		setup: given({
			post: (endpoint) => {
				if (endpoint === '/v1/chat.sendMessage') {
					throw new Error('sync post');
				}
				return Promise.resolve({});
			},
		}),
	},
	{ name: 'after-send callback rejects', ...text('hello'), setup: afterSendRejects },
	{ name: 'composer clear throws before the optimistic insert', ...text('hello'), patch: clearThrows },
	{
		name: 'dismissing the quotes throws: caught by the try',
		...text('hello'),
		patch: (chat) => void Object.assign(chat.composer ?? {}, { dismissAllQuotedMessages: throwing('dismiss boom') }),
	},
	{
		name: 'unread mark throws',
		...text('hello'),
		patch: (chat) => void Object.assign(chat.readStateManager, { clearUnreadMark: throwing('unread boom') }),
	},
	{
		name: 'editing id lookup throws',
		...text('hello'),
		patch: (chat) => void Object.assign(chat.currentEditingMessage, { getMID: throwing('mid boom') }),
	},
	{
		name: 'compose rejects',
		...text('hello'),
		chat: { dataOverrides: { composeMessage: rejecting(new Error('compose boom')) } },
	},
	{
		name: 'uploads probe throws',
		...text('hello'),
		patch: (chat) => void Object.assign(chat.composer?.uploads ?? {}, { get: throwing('uploads boom') }),
	},
	{ name: 'slash command not allowed: goes out as a message', ...text('/help') },
	{
		name: 'slash command unrecognized, allowed: ends the send, callback still runs',
		...text('/nope arg', { isSlashCommandAllowed: true }),
	},
	{
		name: 'slash command unrecognized and the setting allows it',
		...text('/nope arg', { isSlashCommandAllowed: true }),
		setup: setting('Message_AllowUnrecognizedSlashCommand', true),
	},
	{
		name: 'slash command on a plain text is not a command',
		...text('hello', { isSlashCommandAllowed: true }),
	},
	{
		name: 'slash command server',
		...text('/giphy cats', { isSlashCommandAllowed: true }),
		setup: given({ commands: { giphy: { command: 'giphy', result: (...args: unknown[]) => record('command.result', ...args) } } }),
	},
	{
		name: 'slash command client only',
		...text('/clear', { isSlashCommandAllowed: true }),
		setup: given({
			commands: { clear: { command: 'clear', clientOnly: true, callback: (...args: unknown[]) => record('command.callback', ...args) } },
		}),
	},
	{
		name: 'slash command permission denied',
		...text('/mute', { isSlashCommandAllowed: true }),
		setup: given({ commands: { mute: { command: 'mute', permission: 'mute-user' } } }),
	},
	{
		name: 'slash command run fails',
		...text('/giphy', { isSlashCommandAllowed: true }),
		setup: setupBoth(given({ commands: { giphy: { command: 'giphy' } } }), failOn('/v1/commands.run', new Error('run boom'))),
	},
	{
		name: 'slash command push rejects',
		...text('/nope', { isSlashCommandAllowed: true }),
		chat: { dataOverrides: { pushEphemeralMessage: rejecting(new Error('push boom')) } },
	},
	{
		name: 'reaction',
		...text('+:smile:'),
		setup: setupBoth(given({ emojis: { ':smile:': {} } }), seed(lastMessage), () => Subscriptions.state.store(subscription)),
	},
	{ name: 'reaction on a later line', ...text('hi\n+:smile:'), setup: setupBoth(given({ emojis: { ':smile:': {} } }), seed(lastMessage)) },
	{ name: 'reaction with an unknown emoji goes out as a message', ...text('+:nope:') },
	{ name: 'reaction with no message to react to', ...text('+:smile:'), setup: given({ emojis: { ':smile:': {} } }) },
	{
		name: 'reaction request fails: toasted by the flow, rethrown, toasted again by the send',
		...text('+:smile:'),
		setup: setupBoth(given({ emojis: { ':smile:': {} } }), seed(lastMessage), failOn('/v1/chat.react', new Error('react boom'))),
	},
	{
		name: 'reaction while editing',
		...editing(text('+:smile:')),
		setup: setupBoth(given({ emojis: { ':smile:': {} } }), seed(original, lastMessage)),
	},
	{
		name: 'too long, attachments disabled',
		...text('way too long'),
		setup: setting('Message_AllowConvertLongMessagesToAttachment', false),
	},
	{ name: 'too long, uploads disabled', ...text('way too long'), setup: setting('FileUpload_Enabled', false) },
	{ name: 'too long while editing', ...editing(text('way too long')) },
	{ name: 'too long offer left pending', ...text('way too long'), setup: setting('Message_MaxAllowedSize', 5), script: [] },
	{ name: 'too long offer declined', ...text('way too long'), setup: setting('Message_MaxAllowedSize', 5), script: ['onClose'] },
	{ name: 'too long offer accepted', ...text('way too long'), setup: setting('Message_MaxAllowedSize', 5), script: ['onConfirm'] },
	{
		name: 'too long offer accepted in a thread with quotes',
		...text('way too long'),
		chat: { tmid: 'thread-1', quoted: [{ _id: 'q1' } as IMessage] },
		setup: setting('Message_MaxAllowedSize', 5),
		script: ['onConfirm'],
	},
	{
		name: 'too long offer accepted and the upload fails: the send stays pending',
		...text('way too long'),
		setup: setting('Message_MaxAllowedSize', 5),
		script: ['onConfirm'],
		patch: (chat) => void Object.assign(chat.flows, { uploadFiles: rejecting(new Error('upload boom')) }),
	},
	{ name: 'files and text', ...text('caption'), chat: { uploads: [upload] } },
	{ name: 'files alone', ...text(''), chat: { uploads: [upload] } },
	{ name: 'files and whitespace text', ...text('   '), chat: { uploads: [upload] } },
	{
		name: 'files and the confirmation fails',
		...text('caption'),
		chat: { uploads: [upload] },
		setup: failOn('/v1/rooms.mediaConfirm/GENERAL/file-1', new Error('confirm boom')),
	},
	{ name: 'files while editing', ...editing(text('caption')), chat: { editingMid: 'm1', uploads: [upload] } },
	{ name: 'editing with text', ...editing(text('new text')) },
	{ name: 'editing with previewUrls', ...editing(text('new text', { previewUrls: ['https://a.test'] })) },
	{ name: 'editing with tshow', ...editing(text('new text', { tshow: true })) },
	{ name: 'editing with quotes', ...editing(text('new text')), chat: { editingMid: 'm1', quoted: [{ _id: 'q1' } as IMessage] } },
	{
		name: 'editing: update fails',
		...editing(text('new text')),
		setup: setupBoth(seed(original), failOn('/v1/chat.update', new Error('update boom'))),
	},
	{
		name: 'editing keeps the original thread and room',
		chat: { editingMid: 'm2' },
		...text('edited', { tshow: true }),
		setup: seed({ ...original, _id: 'm2', rid: 'OTHER', tmid: 'thread-9' } as IMessage),
	},
	{
		name: 'editing an encrypted original carries attachments and file',
		chat: { editingMid: 'm3' },
		...text('caption'),
		setup: seed({
			...original,
			_id: 'm3',
			t: 'e2e',
			attachments: [{ title: 'a.png', type: 'file' }],
			file: { _id: 'f1', name: 'a.png' },
		} as unknown as IMessage),
	},
	{
		name: 'editing an encrypted original without attachments',
		chat: { editingMid: 'm4' },
		...text('caption'),
		setup: seed({ ...original, _id: 'm4', t: 'e2e', attachments: [] } as unknown as IMessage),
	},
	{
		name: 'editing an encrypted original with attachments undefined',
		chat: { editingMid: 'm5' },
		...text('caption'),
		setup: seed({ ...original, _id: 'm5', t: 'e2e' } as IMessage),
	},
	{
		name: 'editing an encrypted original with the encryption transform',
		chat: { editingMid: 'm3' },
		...text('caption'),
		setup: setupBoth(
			seed({ ...original, _id: 'm3', t: 'e2e', attachments: [{ title: 'a.png' }], file: { _id: 'f1' } } as unknown as IMessage),
			given({
				beforeSendMessage: async (message) =>
					({ ...message, e2e: 'pending', content: { algorithm: 'a', ciphertext: 'c' } }) as unknown as IMessage,
			}),
		),
	},
	{ name: 'editing a system message sends a new message', ...editing(text('hello')), setup: seed({ ...original, t: 'uj' } as IMessage) },
	{
		name: 'editing when the original lookup resolves undefined',
		chat: { editingMid: 'gone', dataOverrides: { findMessageByID: async () => undefined } },
		...text('hello'),
	},
	{ name: 'editing with no text deletes the original', ...editing(text('   ')) },
	{
		name: 'editing with no text keeps a message with attachments',
		...editing(text('')),
		setup: seed({ ...original, attachments: [{ title: 'a.png' }] } as IMessage),
	},
	{
		name: 'editing with no text keeps a message with content',
		...editing(text('')),
		setup: seed({ ...original, content: { algorithm: 'a', ciphertext: 'c' } } as unknown as IMessage),
	},
	{ name: 'editing with no text on a system message', ...editing(text('')), setup: seed({ ...original, t: 'uj' } as IMessage) },
	{
		name: 'editing with no text, original not found: warns',
		chat: { editingMid: 'gone', dataOverrides: { findMessageByID: async () => null } },
		...text(''),
	},
	{
		name: 'editing with no text, lookup fails: rejects',
		chat: { editingMid: 'gone' },
		...text(''),
		setup: given({ get: rejecting(new Error('error-invalid-params')) }),
	},
	{
		name: 'editing with no text, deletion request rejects',
		...editing(text('')),
		patch: (chat) => void Object.assign(chat.flows, { requestMessageDeletion: rejecting(new Error('delete boom')) }),
	},
	{
		name: 'editing with no text, reset rejects',
		...editing(text('')),
		patch: (chat) => void Object.assign(chat.currentEditingMessage, { reset: rejecting(new Error('reset boom')) }),
	},
	{
		name: 'editing with no text, the editing flow rejects',
		...editing(text('')),
		patch: (chat) => void Object.assign(chat.flows, { processMessageEditing: rejecting(new Error('editing boom')) }),
	},
	{
		name: 'editing with no text, update fails inside the editing flow',
		...editing(text('')),
		setup: setupBoth(
			seed({ ...original, attachments: [{ title: 'a.png' }] } as IMessage),
			failOn('/v1/chat.update', new Error('update boom')),
		),
	},
	{
		name: 'editing with no text and no composer',
		chat: { editingMid: 'm1', withComposer: false },
		...text(''),
		setup: seed(original),
	},
];

function throwing(message: string) {
	return () => {
		throw new Error(message);
	};
}
function clearThrows(chat: Chat) {
	Object.assign(chat.composer ?? {}, {
		clear: () => {
			record('chat.composer.clear');
			throw new Error('clear boom');
		},
	});
}
function setting(name: string, value: unknown) {
	return () => {
		behavior.settings[name] = value;
	};
}
function stripTmid() {
	jest.spyOn(onClientMessageReceivedModule, 'onClientMessageReceived').mockImplementation(async (message) => {
		record('onClientMessageReceived', message);
		const { tmid: _, ...rest } = message;
		return rest as IMessage;
	});
}
function addTmid() {
	jest.spyOn(onClientMessageReceivedModule, 'onClientMessageReceived').mockImplementation(async (message) => {
		record('onClientMessageReceived', message);
		return { ...message, tmid: 'thread-7' };
	});
}
function receiveRejects() {
	jest.spyOn(onClientMessageReceivedModule, 'onClientMessageReceived').mockImplementation(async (message) => {
		record('onClientMessageReceived', message);
		throw new Error('receive boom');
	});
}
function receiveRenames() {
	jest.spyOn(onClientMessageReceivedModule, 'onClientMessageReceived').mockImplementation(async (message) => {
		record('onClientMessageReceived', message);
		return { ...message, _id: 'renamed' };
	});
}
function afterSendRejects() {
	jest.spyOn(afterSendMessageCallbackModule, 'afterSendMessageCallback').mockImplementation(async (message, rid) => {
		record('afterSendMessageCallback', message, rid);
		throw new Error('after boom');
	});
}

const settle = async (promise: Promise<unknown>) => {
	let outcome: { status: 'resolved'; value: unknown } | { status: 'rejected'; error: unknown } | undefined;
	void promise.then(
		(value) => {
			outcome = { status: 'resolved', value };
		},
		(error: unknown) => {
			outcome = { status: 'rejected', error };
		},
	);
	let ticks = 0;
	while (!outcome && ticks < 200) {
		await Promise.resolve();
		ticks++;
	}
	return { outcome, ticks };
};

const normalize = (outcome: Awaited<ReturnType<typeof settle>>['outcome']) => {
	if (!outcome) {
		return { status: 'pending' as const };
	}
	if (outcome.status === 'rejected') {
		return {
			status: 'rejected' as const,
			error: outcome.error instanceof Error ? `${outcome.error.name}: ${outcome.error.message}` : outcome.error,
		};
	}
	return outcome;
};

const modalOpened = async () => {
	for (let i = 0; i < 100 && !modalProps.current; i++) {
		await Promise.resolve();
	}
};

const run = async (kind: keyof typeof runners, testCase: Case) => {
	jest.restoreAllMocks();
	jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => record('console.error', ...args));
	resetFakes();
	resetRandom();
	resetStores();
	modalProps.current = undefined;
	Rooms.state.store(room);
	Subscriptions.state.store(subscription);
	testCase.setup?.();
	const stop = trackMessagesStore();
	const chat = createGoldenChat(testCase.chat);
	testCase.patch?.(chat);

	let promise: Promise<boolean>;
	let sync: 'returned' | 'threw' = 'returned';
	try {
		promise = runners[kind](chat, testCase.params as SendMessageParams);
	} catch (error) {
		sync = 'threw';
		promise = Promise.reject(error);
	}

	if (testCase.script) {
		await modalOpened();
		for (const step of testCase.script) {
			try {
				await (modalProps.current?.[step] as (() => unknown) | undefined)?.();
			} catch (error) {
				record('handler.rejected', error instanceof Error ? error.message : error);
			}
		}
	}
	const { outcome, ticks } = await settle(promise);
	stop();

	const store = [...Messages.state.records.values()];
	return {
		sync,
		outcome: normalize(outcome),
		ticks: testCase.script ? undefined : ticks,
		log: getCalls(),
		store,
		storeJson: JSON.stringify(store),
	};
};

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
});

describe('sendMessage differential: frozen legacy copy vs adapter vs core', () => {
	it.each(cases.map((c) => [c.name, c] as const))('%s', async (_name, testCase) => {
		const legacy = await run('legacy', testCase);
		const adapter = await run('adapter', testCase);
		const core = await run('core', testCase);

		expect(adapter).toEqual(legacy);
		expect(core).toEqual(legacy);
	});

	it('covers a true, a false, a rejection and a pending send', async () => {
		const outcomes = new Set<string>();
		for (const testCase of cases) {
			const { outcome } = await run('legacy', testCase);
			outcomes.add(outcome.status === 'resolved' ? String(outcome.value) : outcome.status);
		}
		expect([...outcomes].sort()).toEqual(['false', 'pending', 'rejected', 'true']);
	});

	it('keeps the pinned quirks in the legacy oracle itself', async () => {
		const failed = await run('legacy', { name: 'f', ...text('hello'), setup: failOn('/v1/chat.sendMessage', new Error('boom')) });
		expect(failed.store).toEqual([expect.objectContaining({ _id: 'random-1', temp: true })]);
		expect(failed.log.map(([fn]) => fn)).not.toContain('afterSendMessageCallback');

		const encrypted = await run('legacy', {
			name: 'e',
			...text('secret'),
			setup: given({ beforeSendMessage: async (message) => ({ ...message, msg: 'cipher', e2e: 'pending' }) as IMessage }),
		});
		const posted = encrypted.log.find(([fn, endpoint]) => fn === 'sdk.rest.post' && endpoint === '/v1/chat.sendMessage');
		expect(posted?.[2]).toEqual({ message: { _id: 'random-1', rid: 'GENERAL', msg: 'cipher' }, previewUrls: undefined });
		expect(encrypted.log.at(-1)).toEqual(['afterSendMessageCallback', { _id: 'random-1', rid: 'GENERAL', msg: 'secret' }, 'GENERAL']);

		const duplicate = await run('legacy', {
			name: 'd',
			...text('hello'),
			setup: seed({ _id: 'random-1', rid: 'GENERAL', msg: 'a' } as IMessage),
		});
		expect(duplicate.log.map(([fn]) => fn)).toEqual(expect.arrayContaining(['toast', 'sdk.rest.post']));

		const ended = await run('legacy', { name: 's', ...text('/nope', { isSlashCommandAllowed: true }) });
		expect(ended.log.at(-1)?.[0]).toBe('afterSendMessageCallback');
	});

	it.each([
		['plain', 'hello'],
		['empty', ''],
		['reaction unknown', '+:nope:'],
		['too long toast', 'way too long'],
	])('settles on the same microtask tick as the old async function: %s', async (_name, value) => {
		const testCase: Case = { name: value, ...text(value), setup: setting('Message_AllowConvertLongMessagesToAttachment', false) };
		const legacy = await run('legacy', testCase);
		const adapter = await run('adapter', testCase);
		const core = await run('core', testCase);

		expect(legacy.ticks).toBeLessThan(200);
		expect(adapter.ticks).toBe(legacy.ticks);
		expect(core.ticks).toBe(legacy.ticks);
	});

	it('hands the sub-flows the same chat object the caller passed', async () => {
		const received: unknown[] = [];
		const chat = createGoldenChat();
		resetFakes();
		resetStores();
		Rooms.state.store(room);
		Subscriptions.state.store(subscription);
		const deps = coreDeps();
		await sendMessageCore(
			{
				...deps,
				flows: {
					...deps.flows,
					processSetReaction: async (target) => {
						received.push(target);
						return false;
					},
				},
			},
			chat,
			{ text: 'hello' },
		);

		expect(received).toEqual([chat]);
		expect(received[0]).toBe(chat);
	});
});
