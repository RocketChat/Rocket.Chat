import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { processSetReactionCore, type SetReactionDeps } from './processSetReaction';
import { Messages, Rooms, Subscriptions } from '../../../stores';
import { sdk } from '../../SDKClient';
import { emoji } from '../../emoji';
import { roomCoordinator } from '../../rooms/roomCoordinator';
import { dispatchToastMessage } from '../../toast';
import { getUser, getUserId } from '../../user';
import { processSetReaction } from '../flows/processSetReaction';
import { createGoldenChat, resetStores, trackMessagesStore } from '../goldenChat';
import { NOW, behavior, getCalls, record, resetFakes, toastModule } from '../goldenFakes';
import { legacyProcessSetReaction } from '../legacySetReactionReference';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../emoji', () => jest.requireActual('../goldenFakes').emojiModule);
jest.mock('../../rooms/roomCoordinator', () => jest.requireActual('../goldenFakes').roomCoordinatorModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);

const author = { _id: 'uid1', username: 'john.doe', name: 'John Doe' };
const room = { _id: 'GENERAL', t: 'c' } as IRoom;
const older = { _id: 'older', rid: 'GENERAL', msg: 'older', ts: new Date('2026-11-27T09:00:00.000Z'), u: author } as IMessage;
const last = { _id: 'last', rid: 'GENERAL', msg: 'last', ts: new Date('2026-11-27T09:30:00.000Z'), u: author } as IMessage;
const subscription = { _id: 'sub-1', rid: 'GENERAL', t: 'c', u: { _id: 'uid1', username: 'john.doe' } } as SubscriptionWithRoom;

const coreDeps = (): SetReactionDeps => ({
	getUserId: () => getUserId(),
	getUser: () => getUser(),
	getMessage: (id) => Messages.state.get(id),
	getRoom: (rid) => Rooms.state.get(rid),
	hasSubscription: (rid) => !!Subscriptions.state.find(({ rid: subscriptionRid }) => subscriptionRid === rid),
	emojiExists: (shortcode) => !!emoji.list[shortcode],
	isReadOnly: (target, user) => roomCoordinator.readOnly(target, user),
	updateMessage: (predicate, modifier) => Messages.state.update(predicate, modifier),
	postReaction: (params) => sdk.rest.post('/v1/chat.react', params),
	notifyError: (error) => dispatchToastMessage({ type: 'error', message: error }),
});

type Chat = ReturnType<typeof createGoldenChat>;
type Runner = (chat: Chat, message: Pick<IMessage, 'msg'>) => Promise<boolean>;

const runners: Record<'legacy' | 'adapter' | 'core', Runner> = {
	legacy: legacyProcessSetReaction,
	adapter: processSetReaction,
	core: (chat, message) => processSetReactionCore(coreDeps(), chat, message),
};

type Case = {
	name: string;
	msg?: unknown;
	chat?: Parameters<typeof createGoldenChat>[0];
	setup?: () => void;
};

const given = (patch: Partial<typeof behavior>) => () => {
	Object.assign(behavior, patch);
};
const withReactions =
	(reactions: Record<string, unknown>, extra: object = {}) =>
	() => {
		Messages.state.store({ ...last, reactions, ...extra } as IMessage);
	};
const failingPost = (error: unknown) => () => {
	behavior.post = () => Promise.reject(error);
};

const cases: Case[] = [
	...['hello', '+smile', ':smile:', '+:smile: more', '++:smile:', '+::', '', ' ', '+:smile', '+smile:', '+ :smile:'].map((msg): Case => ({
		name: `not a reaction: ${JSON.stringify(msg)}`,
		msg,
	})),
	{ name: 'reaction', msg: '+:smile:' },
	{ name: 'reaction with surrounding whitespace', msg: '  +:smile:\n ' },
	{ name: 'reaction with surrounding tabs', msg: '\t+:smile:\t' },
	{ name: 'reaction on the second line (multiline flag)', msg: 'hello there\n+:smile:' },
	{ name: 'reaction on the middle line', msg: 'a\n+:+1:\nb' },
	{ name: 'two reaction lines: the first one wins', msg: '+:smile:\n+:+1:' },
	{ name: 'a line with a trailing carriage return does not match', msg: '+:smile:\r\nnext' },
	{ name: 'a carriage return at the end is trimmed', msg: 'x\n+:smile:\r' },
	{ name: 'lazy emoji match spans inner colons', msg: '+:a:b:', setup: given({ emojis: { ':a:b:': {} } }) },
	{ name: 'lazy emoji match with the first pair unknown', msg: '+:a:b:', setup: given({ emojis: { ':a:': {} } }) },
	{ name: 'unicode emoji name', msg: '+:grinning_é:', setup: given({ emojis: { ':grinning_é:': {} } }) },
	{ name: 'astral characters between colons', msg: '+:😀:', setup: given({ emojis: { ':😀:': {} } }) },
	{ name: 'unknown emoji', msg: '+:nope:' },
	{ name: 'emoji entry is falsy: zero', msg: '+:smile:', setup: given({ emojis: { ':smile:': 0 } }) },
	{ name: 'emoji entry is falsy: empty string', msg: '+:smile:', setup: given({ emojis: { ':smile:': '' } }) },
	{ name: 'emoji entry is truthy: empty string key value true', msg: '+:smile:', setup: given({ emojis: { ':smile:': true } }) },
	{ name: 'no emoji at all', msg: '+:smile:', setup: given({ emojis: {} }) },
	{
		name: 'no last message in the room',
		msg: '+:smile:',
		setup: () => Messages.useStore.setState({ records: new Map() }),
	},
	{
		name: 'last message lookup resolves undefined',
		msg: '+:smile:',
		chat: { dataOverrides: { findLastMessage: async () => undefined } },
	},
	{
		name: 'last message lookup rejects',
		msg: '+:smile:',
		chat: {
			dataOverrides: {
				findLastMessage: async () => {
					throw new Error('lookup failed');
				},
			},
		},
	},
	{
		name: 'last message lookup returns a message that is not in the store',
		msg: '+:smile:',
		chat: { dataOverrides: { findLastMessage: async () => ({ ...last, _id: 'ghost' }) } },
	},
	{ name: 'without a composer', msg: '+:smile:', chat: { withComposer: false } },
	{
		name: 'in a thread with a reply',
		msg: '+:smile:',
		chat: { tmid: 'thread-1' },
		setup: () => Messages.state.store({ ...last, _id: 'reply', tmid: 'thread-1', ts: new Date('2026-11-27T09:45:00.000Z') } as IMessage),
	},
	{
		name: 'thread newest hidden and reply ignored in the room',
		msg: '+:smile:',
		setup: () => {
			Messages.state.store({ ...last, _id: 'reply', tmid: 'thread-1', ts: new Date('2026-11-27T09:45:00.000Z') } as IMessage);
			Messages.state.store({ ...last, _id: 'hidden', ts: new Date('2026-11-27T09:50:00.000Z'), _hidden: true } as IMessage);
		},
	},
	{
		name: 'last message without reactions toggled by the same user',
		msg: '+:smile:',
		setup: withReactions({ ':smile:': { usernames: ['john.doe'] } }),
	},
	{
		name: 'toggle off keeps the extra fields of the value',
		msg: '+:smile:',
		setup: withReactions({ ':smile:': { usernames: ['john.doe', 'alice'], names: ['John', 'Alice'] } }),
	},
	{
		name: 'add after another user, keeping names',
		msg: '+:smile:',
		setup: withReactions({ ':smile:': { usernames: ['alice'], names: ['Alice'] } }),
	},
	{ name: 'an existing reaction with an empty user list', msg: '+:smile:', setup: withReactions({ ':smile:': { usernames: [] } }) },
	{ name: 'another reaction of the same message', msg: '+:smile:', setup: withReactions({ ':+1:': { usernames: ['alice'] } }) },
	{
		name: 'remove the only reaction of the user and keep the others in order',
		msg: '+:smile:',
		setup: withReactions({ ':+1:': { usernames: ['alice'] }, ':smile:': { usernames: ['john.doe'] }, ':a:': { usernames: ['bob'] } }),
	},
	{ name: 'reactions is an empty object', msg: '+:smile:', setup: withReactions({}) },
	{
		name: 'a message with other fields (temp, unread, edited)',
		msg: '+:smile:',
		setup: withReactions({}, { temp: true, unread: true, editedAt: NOW }),
	},
	{ name: 'without a user id', msg: '+:smile:', setup: given({ userId: undefined }) },
	{ name: 'with an empty user id', msg: '+:smile:', setup: given({ userId: '' }) },
	{ name: 'without a user', msg: '+:smile:', setup: given({ user: undefined }) },
	{ name: 'without a username', msg: '+:smile:', setup: given({ user: { _id: 'uid1' } }) },
	{ name: 'with an empty username', msg: '+:smile:', setup: given({ user: { _id: 'uid1', username: '' } }) },
	{ name: 'the room is not in the store', msg: '+:smile:', setup: () => Rooms.useStore.setState({ records: new Map() }) },
	{ name: 'read only for the user', msg: '+:smile:', setup: given({ readOnly: true }) },
	{ name: 'not subscribed', msg: '+:smile:', setup: () => Subscriptions.useStore.setState({ records: new Map() }) },
	{
		name: 'subscribed to another room only',
		msg: '+:smile:',
		setup: () => {
			Subscriptions.useStore.setState({ records: new Map() });
			Subscriptions.state.store({ ...subscription, _id: 'sub-2', rid: 'OTHER' });
		},
	},
	{ name: 'last message is private', msg: '+:smile:', setup: () => Messages.state.store({ ...last, private: true } as IMessage) },
	{ name: 'request fails with an error', msg: '+:smile:', setup: failingPost(new Error('error-not-allowed')) },
	{ name: 'request fails with a string', msg: '+:smile:', setup: failingPost('plain') },
	{ name: 'request fails with undefined', msg: '+:smile:', setup: failingPost(undefined) },
	{
		name: 'request throws synchronously',
		msg: '+:smile:',
		setup: () => {
			behavior.post = () => {
				throw new Error('sync boom');
			};
		},
	},
	{
		name: 'request fails and the toast throws too',
		msg: '+:smile:',
		setup: () => {
			failingPost(new Error('post failed'))();
			jest.spyOn(toastModule, 'dispatchToastMessage').mockImplementation(() => {
				throw new Error('toast boom');
			});
		},
	},
	{
		name: 'the composer clear throws',
		msg: '+:smile:',
		chat: {},
		setup: () => undefined,
	},
	{
		name: 'the readOnly check throws',
		msg: '+:smile:',
		setup: () => {
			Object.defineProperty(behavior, 'readOnly', {
				configurable: true,
				get: () => {
					throw new Error('readOnly boom');
				},
			});
		},
	},
	{ name: 'message without msg', msg: undefined },
	{ name: 'msg is a number', msg: 5 },
	{ name: 'msg is null', msg: null },
];

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
	while (!outcome && ticks < 100) {
		await Promise.resolve();
		ticks++;
	}
	return { outcome, ticks };
};

const normalize = (outcome: Awaited<ReturnType<typeof settle>>['outcome']) =>
	outcome?.status === 'rejected'
		? {
				status: 'rejected' as const,
				error: outcome.error instanceof Error ? `${outcome.error.name}: ${outcome.error.message}` : outcome.error,
			}
		: outcome;

const run = async (kind: keyof typeof runners, testCase: Case) => {
	jest.restoreAllMocks();
	Reflect.deleteProperty(behavior, 'readOnly');
	resetFakes();
	resetStores();
	Rooms.state.store(room);
	Subscriptions.state.store(subscription);
	Messages.state.store(older);
	Messages.state.store(last);
	behavior.emojis = { ':smile:': {}, ':+1:': {} };
	testCase.setup?.();
	const listed = behavior.emojis;
	behavior.emojis = new Proxy(listed, {
		get: (target, key) => {
			record('emoji.list', String(key));
			return Reflect.get(target, key);
		},
	});
	const stop = trackMessagesStore();
	const chat = createGoldenChat(testCase.chat);
	if (testCase.name === 'the composer clear throws' && chat.composer) {
		chat.composer.clear = () => {
			record('chat.composer.clear');
			throw new Error('clear boom');
		};
	}

	let promise: Promise<boolean>;
	try {
		promise = runners[kind](chat, { msg: testCase.msg as string });
	} catch (error) {
		promise = Promise.reject(error);
	}
	const { outcome, ticks } = await settle(promise);
	stop();

	const store = [...Messages.state.records.values()];
	return { outcome: normalize(outcome), ticks, log: getCalls(), store, storeJson: JSON.stringify(store) };
};

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
	Reflect.deleteProperty(behavior, 'readOnly');
	jest.restoreAllMocks();
	jest.useRealTimers();
});

describe('processSetReaction differential: frozen legacy copy vs adapter vs core', () => {
	it.each(cases.map((c) => [c.name, c] as const))('%s', async (_name, testCase) => {
		const legacy = await run('legacy', testCase);
		const adapter = await run('adapter', testCase);
		const core = await run('core', testCase);

		expect(legacy.outcome).toBeDefined();
		expect(adapter).toEqual(legacy);
		expect(core).toEqual(legacy);
	});

	it('covers a true, a false and a rejection', async () => {
		const outcomes = new Set<string>();
		for (const testCase of cases) {
			const { outcome } = await run('legacy', testCase);
			outcomes.add(outcome?.status === 'resolved' ? String(outcome.value) : 'rejected');
		}
		expect([...outcomes].sort()).toEqual(['false', 'rejected', 'true']);
	});

	it('keeps the pinned quirks in the legacy oracle itself', async () => {
		const multiline = await run('legacy', { name: 'm', msg: 'hello there\n+:smile:' });
		expect(multiline.log.at(-1)).toEqual(['sdk.rest.post', '/v1/chat.react', { emoji: ':smile:', messageId: 'last' }]);

		const failed = await run('legacy', { name: 'f', msg: '+:smile:', setup: failingPost(new Error('nope')) });
		expect(failed.outcome).toEqual({ status: 'rejected', error: 'Error: nope' });
		expect(JSON.parse(failed.storeJson).find((m: IMessage) => m._id === 'last').reactions).toEqual({
			':smile:': { usernames: ['john.doe'] },
		});

		const checks = (await run('legacy', { name: 'e', msg: '+:smile:' })).log.filter(([fn]) => fn === 'emoji.list');
		expect(checks).toHaveLength(2);
	});

	it('keeps the identity of an untouched record when the optimistic step is skipped', async () => {
		for (const kind of ['legacy', 'adapter', 'core'] as const) {
			const { store } = await run(kind, { name: 's', msg: '+:smile:', setup: given({ readOnly: true }) });
			expect(store.find((m) => m._id === 'last')).toEqual(last);
		}
	});

	it.each([
		['reaction', '+:smile:', undefined],
		['non-reaction', 'hello', undefined],
		['unknown emoji', '+:nope:', undefined],
		['request fails', '+:smile:', failingPost(new Error('x'))],
		['no last message', '+:smile:', () => Messages.useStore.setState({ records: new Map() })],
	] as [string, string, (() => void) | undefined][])(
		'settles on the same microtask tick as the old async function: %s',
		async (_name, msg, setup) => {
			const testCase: Case = { name: msg, msg, setup };
			const legacy = await run('legacy', testCase);
			const adapter = await run('adapter', testCase);
			const core = await run('core', testCase);

			expect(legacy.ticks).toBeLessThan(100);
			expect(adapter.ticks).toBe(legacy.ticks);
			expect(core.ticks).toBe(legacy.ticks);
		},
	);
});
