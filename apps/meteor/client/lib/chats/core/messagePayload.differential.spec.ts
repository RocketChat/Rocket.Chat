import type { IEditedMessage, IMessage } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { composeMessageCore, getUpdateMessageParams, type ComposeMessageOptions } from './messagePayload';
import { prependReplies } from '../../utils/prependReplies';
import { createDataAPI } from '../data';
import { NOW, behavior, getCalls, record, resetFakes, resetRandom } from '../goldenFakes';
import { legacyComposeMessage, legacyUpdateMessage } from '../legacyPayloadReference';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);
jest.mock('@rocket.chat/random', () => jest.requireActual('../goldenFakes').randomModule);

beforeEach(() => {
	resetFakes();
	resetRandom();
});

const quoted = (...ids: string[]) => ids.map((_id) => ({ _id }) as IMessage);
const original = (extra: object = {}) => ({ _id: 'orig', rid: 'ROOM-O', msg: 'old', ts: NOW, ...extra }) as IMessage;

type ComposeCase = { name: string; tmid: string | undefined; text: string; options: ComposeMessageOptions };

const composeCases: ComposeCase[] = [
	{ name: 'plain', tmid: undefined, text: 'hello', options: { quotedMessages: [] } },
	{ name: 'empty text', tmid: undefined, text: '', options: { quotedMessages: [] } },
	{ name: 'thread', tmid: 'thread-1', text: 'hi', options: { quotedMessages: [] } },
	{ name: 'thread to channel', tmid: 'thread-1', text: 'hi', options: { quotedMessages: [], sendToChannel: true } },
	{ name: 'tshow without a thread is dropped', tmid: undefined, text: 'hi', options: { quotedMessages: [], sendToChannel: true } },
	{ name: 'tshow false', tmid: 'thread-1', text: 'hi', options: { quotedMessages: [], sendToChannel: false } },
	{ name: 'one quote', tmid: undefined, text: 'body', options: { quotedMessages: quoted('q1') } },
	{ name: 'quotes keep input order', tmid: 'thread-1', text: 'body', options: { quotedMessages: quoted('q1', 'q2', 'q3') } },
	{ name: 'edit keeps id and room', tmid: undefined, text: 'edit', options: { quotedMessages: [], originalMessage: original() } },
	{
		name: 'edit of a thread message takes its tmid, not the context one',
		tmid: 'ctx-thread',
		text: 'edit',
		options: { quotedMessages: [], originalMessage: original({ tmid: 'orig-thread' }) },
	},
	{
		name: 'edit of a main message in a thread context drops tmid',
		tmid: 'ctx-thread',
		text: 'edit',
		options: { quotedMessages: [], originalMessage: original() },
	},
	{
		name: 'edit with tshow',
		tmid: undefined,
		text: 'edit',
		options: { quotedMessages: [], originalMessage: original({ tmid: 'orig-thread' }), sendToChannel: true },
	},
	{
		name: 'edit with an empty id falls through to a random id',
		tmid: undefined,
		text: 'edit',
		options: { quotedMessages: quoted('q1'), originalMessage: original({ _id: undefined }) },
	},
	{ name: 'edit with quotes', tmid: undefined, text: 'edit', options: { quotedMessages: quoted('q1', 'q2'), originalMessage: original() } },
	{ name: 'null original message is a plain send', tmid: 'thread-1', text: 'hi', options: { quotedMessages: [], originalMessage: null } },
	{
		name: 'null original message with tshow',
		tmid: 'thread-1',
		text: 'hi',
		options: { quotedMessages: [], originalMessage: null, sendToChannel: true },
	},
];

const runAdapter = async ({ tmid, text, options }: ComposeCase) => {
	const result = await createDataAPI({ rid: 'GENERAL', tmid }).composeMessage(text, options);
	return { result, log: getCalls() };
};

const runCore = async ({ tmid, text, options }: ComposeCase) => {
	const result = await composeMessageCore(
		{
			prependReplies: (replies, list) => prependReplies(replies, list),
			randomId: () => Random.id(),
		},
		{ rid: 'GENERAL', tmid },
		text,
		options,
	);
	return { result, log: getCalls() };
};

describe('composeMessage: adapter and core agree', () => {
	it.each(composeCases.map((c) => [c.name, c] as const))('%s', async (_name, testCase) => {
		const fromAdapter = await runAdapter(testCase);
		resetFakes();
		resetRandom();
		const fromCore = await runCore(testCase);

		expect(fromCore.result).toStrictEqual(fromAdapter.result);
		expect(fromCore.log).toEqual(fromAdapter.log);
	});

	it('resolves the permalinks before it draws an id, in the same order', async () => {
		const fromAdapter = await runAdapter(composeCases[7]);
		resetFakes();
		resetRandom();
		const fromCore = await runCore(composeCases[7]);

		expect(fromAdapter.log).toEqual([
			['getPermaLink', 'q1'],
			['getPermaLink', 'q2'],
			['getPermaLink', 'q3'],
		]);
		expect(fromCore.log).toEqual(fromAdapter.log);
	});

	it('rejects the same way when a permalink fails, and draws no id', async () => {
		behavior.permaLinkError = new Error('no link');
		const testCase = composeCases[6];

		const fromAdapter = await runAdapter(testCase).catch((e: Error) => e.message);
		resetFakes();
		resetRandom();
		behavior.permaLinkError = new Error('no link');
		const fromCore = await runCore(testCase).catch((e: Error) => e.message);

		expect(fromCore).toBe('no link');
		expect(fromCore).toBe(fromAdapter);
		expect(Random.id()).toBe('random-1');
	});

	it('takes the context from the call, not from a captured value', async () => {
		const api = createDataAPI({ rid: 'GENERAL', tmid: 'thread-1' });

		const first = await api.composeMessage('a', { quotedMessages: [] });
		const second = await api.composeMessage('b', { quotedMessages: [] });

		expect([first._id, second._id]).toEqual(['random-1', 'random-2']);
	});
});

const edited = (extra: object = {}) => ({ _id: 'm1', rid: 'GENERAL', msg: 'text', ts: NOW, ...extra }) as IEditedMessage;

const updateCases: [string, IEditedMessage, string[] | undefined][] = [
	['plain text', edited(), undefined],
	['preview urls', edited(), ['https://a.example', 'https://b.example']],
	['empty preview urls', edited(), []],
	['custom fields', edited({ customFields: { k: 1 } }), undefined],
	[
		'encrypted content',
		edited({ t: 'e2e', content: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'abc' }, e2eMentions: { e2eUserMentions: ['u'] } }),
		['https://x'],
	],
	['encrypted content without mentions', edited({ t: 'e2e', content: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'abc' } }), undefined],
	['text with a content-like field that is not encrypted', edited({ content: undefined, msg: 'plain' }), undefined],
];

describe('updateMessage params: adapter and core agree', () => {
	it.each(updateCases)('%s', async (_name, message, previewUrls) => {
		await createDataAPI({ rid: 'GENERAL', tmid: undefined }).updateMessage(message, previewUrls);
		const fromAdapter = getCalls();
		resetFakes();

		record('sdk.rest.post', '/v1/chat.update', getUpdateMessageParams(message, previewUrls));

		expect(getCalls()).toEqual(fromAdapter);
		expect(fromAdapter).toHaveLength(1);
	});

	it('does not post when the params builder is the only thing called', () => {
		getUpdateMessageParams(edited());

		expect(getCalls()).toEqual([]);
	});
});

const contexts: { name: string; rid: string; tmid: string | undefined }[] = [
	{ name: 'main room', rid: 'GENERAL', tmid: undefined },
	{ name: 'thread', rid: 'GENERAL', tmid: 'ctx-thread' },
	{ name: 'other room thread', rid: 'ROOM-2', tmid: 'thread-2' },
];

const texts = ['', 'hello', 'multi\nline', '  spaced  '];

const optionSets: [string, ComposeMessageOptions][] = [
	...[quoted(), quoted('q1'), quoted('q1', 'q2', 'q3')].flatMap((list) =>
		([undefined, true, false] as const).map((sendToChannel): [string, ComposeMessageOptions] => [
			`${list.length} quotes, sendToChannel ${String(sendToChannel)}`,
			{ quotedMessages: list, sendToChannel },
		]),
	),
	['edit', { quotedMessages: [], originalMessage: original() }],
	['edit of a thread message', { quotedMessages: [], originalMessage: original({ tmid: 'orig-thread' }) }],
	['edit of a thread message with tshow', { quotedMessages: [], originalMessage: original({ tmid: 'orig-thread' }), sendToChannel: true }],
	['edit without an id, with quotes', { quotedMessages: quoted('q1'), originalMessage: original({ _id: undefined }) }],
	['edit with an empty id', { quotedMessages: [], originalMessage: original({ _id: '' }) }],
	['edit with quotes', { quotedMessages: quoted('q1', 'q2'), originalMessage: original() }],
	['edit with tshow but no thread', { quotedMessages: [], originalMessage: original(), sendToChannel: true }],
	['null original message', { quotedMessages: [], originalMessage: null }],
];

const outcome = async (run: () => Promise<unknown>) => {
	const settled = await run().then(
		(value) => ({ value, keys: JSON.stringify(value) }),
		(error: Error) => ({ error: error.message }),
	);
	return { settled, log: getCalls() };
};

const fresh = () => {
	resetFakes();
	resetRandom();
};

describe('composeMessage: the extracted code matches a frozen copy of the old logic', () => {
	it('covers 3 contexts x 4 texts x 17 option sets', () => {
		expect(contexts.length * texts.length * optionSets.length).toBe(204);
	});

	describe.each(contexts)('$name', ({ rid, tmid }) => {
		it.each(texts.map((text) => [JSON.stringify(text), text]))('text %s', async (_label, text) => {
			for (const [name, options] of optionSets) {
				fresh();
				const legacy = await outcome(() => legacyComposeMessage({ rid, tmid }, text, options));
				fresh();
				const adapter = await outcome(() => createDataAPI({ rid, tmid }).composeMessage(text, options));
				fresh();
				const core = await outcome(() =>
					composeMessageCore(
						{ prependReplies: (replies, list) => prependReplies(replies, list), randomId: () => Random.id() },
						{ rid, tmid },
						text,
						options,
					),
				);

				expect({ name, ...adapter }).toStrictEqual({ name, ...legacy });
				expect({ name, ...core }).toStrictEqual({ name, ...legacy });
			}
		});
	});

	it('rejects like the old code when a permalink fails, before it draws an id', async () => {
		const options = { quotedMessages: quoted('q1', 'q2') };
		const failing = () => {
			fresh();
			behavior.permaLinkError = new Error('no link');
		};

		failing();
		const legacy = await outcome(() => legacyComposeMessage({ rid: 'GENERAL', tmid: undefined }, 'x', options));
		failing();
		const adapter = await outcome(() => createDataAPI({ rid: 'GENERAL', tmid: undefined }).composeMessage('x', options));

		expect(legacy.settled).toEqual({ error: 'no link' });
		expect(adapter).toStrictEqual(legacy);
		expect(Random.id()).toBe('random-1');
	});

	it('settles on the same microtask tick as the old async function', async () => {
		const ticksToSettle = async (promise: Promise<unknown>) => {
			let done = false;
			void promise.then(() => {
				done = true;
			});
			let ticks = 0;
			while (!done && ticks < 50) {
				await Promise.resolve();
				ticks++;
			}
			return ticks;
		};
		const options = { quotedMessages: quoted('q1') };

		fresh();
		const legacy = await ticksToSettle(legacyComposeMessage({ rid: 'GENERAL', tmid: undefined }, 'x', options));
		fresh();
		const adapter = await ticksToSettle(createDataAPI({ rid: 'GENERAL', tmid: undefined }).composeMessage('x', options));

		expect(legacy).toBeLessThan(50);
		expect(adapter).toBe(legacy);
	});
});

const v1 = { algorithm: 'rc.v1.aes-sha2', ciphertext: 'abc' };
const v2 = { algorithm: 'rc.v2.aes-sha2', ciphertext: 'abc', iv: 'iv', kid: 'kid' };

const legacyUpdateCases: [string, IEditedMessage, string[] | undefined][] = [
	['plain text', edited(), undefined],
	['preview urls', edited(), ['https://a.example']],
	['empty preview urls', edited(), []],
	['custom fields', edited({ customFields: { k: 1 } }), undefined],
	['e2e v1 with mentions and preview urls', edited({ t: 'e2e', content: v1, e2eMentions: { e2eUserMentions: ['u'] } }), ['https://x']],
	['e2e v1 without mentions', edited({ t: 'e2e', content: v1 }), undefined],
	['e2e v2', edited({ t: 'e2e', content: v2 }), undefined],
	[
		'e2e v2 with mentions',
		edited({ t: 'e2e', content: v2, e2eMentions: { e2eUserMentions: ['u'], e2eChannelMentions: ['c'] } }),
		['https://x'],
	],
	[
		'e2e v2 missing its iv is sent as text',
		edited({ t: 'e2e', content: { algorithm: 'rc.v2.aes-sha2', ciphertext: 'abc' }, msg: 'm' }),
		undefined,
	],
	['unknown algorithm is sent as text', edited({ content: { algorithm: 'other', ciphertext: 'abc' }, msg: 'm' }), undefined],
	['content together with text', edited({ content: v1, msg: 'ignored' }), ['https://y']],
];

describe('updateMessage: the extracted code matches a frozen copy of the old logic', () => {
	it.each(legacyUpdateCases)('%s', async (_name, message, previewUrls) => {
		fresh();
		const legacy = await outcome(() => legacyUpdateMessage(message, previewUrls));
		fresh();
		const adapter = await outcome(() => createDataAPI({ rid: 'GENERAL', tmid: undefined }).updateMessage(message, previewUrls));

		expect(adapter).toStrictEqual(legacy);
		expect(legacy.log).toHaveLength(1);
		expect(JSON.stringify(legacy.log)).toBe(JSON.stringify(adapter.log));
	});
});
