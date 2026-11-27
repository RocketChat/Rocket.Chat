import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { processSetReaction } from './processSetReaction';
import { Messages, Rooms, Subscriptions } from '../../../stores';
import { createGoldenChat, resetStores, trackMessagesStore } from '../goldenChat';
import { NOW, behavior, clearCalls, getCalls, resetFakes } from '../goldenFakes';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../emoji', () => jest.requireActual('../goldenFakes').emojiModule);
jest.mock('../../rooms/roomCoordinator', () => jest.requireActual('../goldenFakes').roomCoordinatorModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);

const user = { _id: 'uid1', username: 'john.doe', name: 'John Doe' };
const room = { _id: 'GENERAL', t: 'c' } as IRoom;

const older = { _id: 'older', rid: 'GENERAL', msg: 'older', ts: new Date('2026-11-27T09:00:00.000Z'), u: user } as IMessage;
const last = { _id: 'last', rid: 'GENERAL', msg: 'last', ts: new Date('2026-11-27T09:30:00.000Z'), u: user } as IMessage;

const stored = (id: string) => Messages.state.get(id);

const react = ['sdk.rest.post', '/v1/chat.react', { emoji: ':smile:', messageId: 'last' }];

// What the optimistic step reads before it writes, in order, up to the readOnly check.
const reads = [['getUserId'], ['getUser'], ['roomCoordinator.readOnly', room, user]];

let stopTracking: () => void;

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
	resetFakes();
	resetStores();
	behavior.emojis = { ':smile:': {}, ':+1:': {} };
	Rooms.state.store(room);
	Subscriptions.state.store({ _id: 'sub-1', rid: 'GENERAL', t: 'c', u: { _id: 'uid1', username: 'john.doe' } } as SubscriptionWithRoom);
	Messages.state.store(older);
	Messages.state.store(last);
	stopTracking = trackMessagesStore();
});

afterEach(() => {
	stopTracking();
	jest.useRealTimers();
});

describe('processSetReaction golden: text that is not a reaction', () => {
	it.each([['hello'], ['+smile'], [':smile:'], ['+:smile: more'], ['++:smile:'], ['+::'], ['']])(
		'returns false without any call for %j',
		async (msg) => {
			const chat = createGoldenChat();

			await expect(processSetReaction(chat, { msg })).resolves.toBe(false);

			expect(getCalls().filter(([fn]) => fn !== 'chat.data.findLastMessage')).toEqual([]);
		},
	);

	it('returns false without looking for a message when the emoji is unknown', async () => {
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: '+:nope:' })).resolves.toBe(false);

		expect(getCalls()).toEqual([]);
	});

	it('returns false after looking for the last message when the room has none', async () => {
		Messages.useStore.setState({ records: new Map() });
		clearCalls();
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: '+:smile:' })).resolves.toBe(false);

		expect(getCalls()).toEqual([['chat.data.findLastMessage']]);
	});

	it('treats any line of a multi-line text as the reaction (the pattern is multiline)', async () => {
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: 'hello there\n+:smile:' })).resolves.toBe(true);

		expect(getCalls().at(-1)).toEqual(react);
	});
});

describe('processSetReaction golden: adding a reaction', () => {
	it('clears, updates the last message optimistically, then posts', async () => {
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: '+:smile:' })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			['chat.data.findLastMessage'],
			['chat.composer.clear'],
			...reads,
			['Messages.store', { ...last, reactions: { ':smile:': { usernames: ['john.doe'] } } }],
			react,
		]);
		expect(stored('last')).toEqual({ ...last, reactions: { ':smile:': { usernames: ['john.doe'] } } });
		expect(stored('older')).toBe(older);
	});

	it('accepts surrounding whitespace', async () => {
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: '  +:smile:\n ' })).resolves.toBe(true);

		expect(getCalls().at(-1)).toEqual(react);
	});

	it('adds the user after the existing users of the same reaction and keeps the rest of the value', async () => {
		Messages.state.store({ ...last, reactions: { ':smile:': { usernames: ['alice'], names: ['Alice'] } } } as IMessage);
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(stored('last')?.reactions).toEqual({ ':smile:': { usernames: ['alice', 'john.doe'], names: ['Alice'] } });
	});

	it('keeps other reactions and appends the new one last', async () => {
		Messages.state.store({ ...last, reactions: { ':+1:': { usernames: ['alice'] } } } as IMessage);
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(Object.keys(stored('last')?.reactions ?? {})).toEqual([':+1:', ':smile:']);
	});

	it('works without a composer', async () => {
		const chat = createGoldenChat({ withComposer: false });

		await expect(processSetReaction(chat, { msg: '+:smile:' })).resolves.toBe(true);

		expect(getCalls().map(([fn]) => fn)).not.toContain('chat.composer.clear');
	});
});

describe('processSetReaction golden: toggling a reaction off', () => {
	it('removes the user, and the reaction when nobody is left, then drops the reactions key when empty', async () => {
		Messages.state.store({ ...last, reactions: { ':smile:': { usernames: ['john.doe'] } } } as IMessage);
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(
			getCalls()
				.filter(([fn]) => fn === 'Messages.store')
				.at(-1),
		).toEqual(['Messages.store', last]);
		expect(stored('last')).not.toHaveProperty('reactions');
		expect(getCalls().at(-1)).toEqual(react);
	});

	it('keeps the reaction when another user is left', async () => {
		Messages.state.store({ ...last, reactions: { ':smile:': { usernames: ['john.doe', 'alice'] } } } as IMessage);
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(stored('last')?.reactions).toEqual({ ':smile:': { usernames: ['alice'] } });
	});

	it('keeps other reactions when the only one of the user is removed', async () => {
		Messages.state.store({
			...last,
			reactions: { ':smile:': { usernames: ['john.doe'] }, ':+1:': { usernames: ['alice'] } },
		} as IMessage);
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(stored('last')?.reactions).toEqual({ ':+1:': { usernames: ['alice'] } });
	});
});

describe('processSetReaction golden: optimistic step skipped, request still sent', () => {
	it('without a user id', async () => {
		behavior.userId = undefined;
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: '+:smile:' })).resolves.toBe(true);

		expect(getCalls()).toEqual([['chat.data.findLastMessage'], ['chat.composer.clear'], ['getUserId'], react]);
		expect(stored('last')).toBe(last);
	});

	it('without a username', async () => {
		behavior.user = { _id: 'uid1' };
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls()).toEqual([['chat.data.findLastMessage'], ['chat.composer.clear'], ['getUserId'], ['getUser'], react]);
	});

	it('when the room is not in the store', async () => {
		Rooms.useStore.setState({ records: new Map() });
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls()).toEqual([['chat.data.findLastMessage'], ['chat.composer.clear'], ['getUserId'], ['getUser'], react]);
		expect(stored('last')).toBe(last);
	});

	it('when the room is read only for the user', async () => {
		behavior.readOnly = true;
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls()).toEqual([['chat.data.findLastMessage'], ['chat.composer.clear'], ...reads, react]);
		expect(stored('last')).toBe(last);
	});

	it('when the user is not subscribed to the room', async () => {
		Subscriptions.useStore.setState({ records: new Map() });
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls()).toEqual([['chat.data.findLastMessage'], ['chat.composer.clear'], ...reads, react]);
		expect(stored('last')).toBe(last);
	});

	it('when the last message is private', async () => {
		const privateLast = { ...last, private: true } as IMessage;
		Messages.state.store(privateLast);
		clearCalls();
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls()).toEqual([['chat.data.findLastMessage'], ['chat.composer.clear'], ['getUserId'], ['getUser'], react]);
		expect(stored('last')).toBe(privateLast);
	});
});

describe('processSetReaction golden: which message is reacted to', () => {
	const threadReply = { ...last, _id: 'reply', tmid: 'thread-1', ts: new Date('2026-11-27T09:45:00.000Z') } as IMessage;
	const hidden = { ...last, _id: 'hidden', ts: new Date('2026-11-27T09:50:00.000Z'), _hidden: true } as IMessage;

	it('ignores thread replies in the main room and hidden messages', async () => {
		Messages.state.store(threadReply);
		Messages.state.store(hidden);
		const chat = createGoldenChat();

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls().at(-1)).toEqual(react);
	});

	it('picks only replies of its own thread inside a thread', async () => {
		Messages.state.store(threadReply);
		const chat = createGoldenChat({ tmid: 'thread-1' });

		await processSetReaction(chat, { msg: '+:smile:' });

		expect(getCalls().at(-1)).toEqual(['sdk.rest.post', '/v1/chat.react', { emoji: ':smile:', messageId: 'reply' }]);
	});
});

describe('processSetReaction golden: request failure', () => {
	it('toasts, rethrows, and keeps the optimistic reaction', async () => {
		const failure = new Error('error-not-allowed');
		behavior.post = async () => {
			throw failure;
		};
		const chat = createGoldenChat();

		await expect(processSetReaction(chat, { msg: '+:smile:' })).rejects.toBe(failure);

		expect(getCalls().slice(-3)).toEqual([
			['Messages.store', { ...last, reactions: { ':smile:': { usernames: ['john.doe'] } } }],
			react,
			['toast', { type: 'error', message: failure }],
		]);
		expect(stored('last')?.reactions).toEqual({ ':smile:': { usernames: ['john.doe'] } });
	});
});
