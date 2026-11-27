import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { escapeHTML } from '@rocket.chat/tools';

import { processSlashCommandCore, type SlashCommandDeps } from './processSlashCommand';
import { t } from '../../../../lib/i18n';
import { Messages, Rooms } from '../../../stores';
import { sdk } from '../../SDKClient';
import { hasAtLeastOnePermission } from '../../authorization';
import { settings } from '../../settings';
import { slashCommands } from '../../slashCommand';
import { processSlashCommand } from '../flows/processSlashCommand';
import { createGoldenChat, resetStores, trackMessagesStore } from '../goldenChat';
import { authorizationModule, NOW, behavior, getCalls, record, resetFakes, resetRandom } from '../goldenFakes';
import { legacyProcessSlashCommand } from '../legacySlashReference';

jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../slashCommand', () => jest.requireActual('../goldenFakes').slashCommandModule);
jest.mock('../../../../lib/i18n', () => jest.requireActual('../goldenFakes').i18nModule);
jest.mock('@rocket.chat/random', () => jest.requireActual('../goldenFakes').randomModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);

const message = (msg: string, extra: object = {}) => ({ _id: 'm1', rid: 'GENERAL', msg, ...extra }) as IMessage;

const coreDeps = (): SlashCommandDeps => ({
	getCommand: (name) => slashCommands.commands[name],
	isUnrecognizedAllowed: () => settings.peek('Message_AllowUnrecognizedSlashCommand'),
	hasAtLeastOnePermission: (permission, rid) => hasAtLeastOnePermission(permission, rid),
	postTelemetry: (event) => sdk.rest.post('/v1/statistics.telemetry', { params: [event] }),
	runCommand: (params) => sdk.rest.post('/v1/commands.run', params),
	t: (key, options) => t(key, options),
	escapeHTML: (text) => escapeHTML(text),
	randomId: () => Random.id(),
});

type Runner = (chat: ReturnType<typeof createGoldenChat>, msg: IMessage) => Promise<boolean>;

const runners: Record<'legacy' | 'adapter' | 'core', Runner> = {
	legacy: legacyProcessSlashCommand,
	adapter: processSlashCommand,
	core: (chat, msg) => processSlashCommandCore(coreDeps(), chat, msg),
};

type Case = {
	name: string;
	msg: string;
	extra?: object;
	chat?: Parameters<typeof createGoldenChat>[0];
	setup?: () => void;
};

const clientOnly = (extra: object = {}) => ({
	command: 'clear',
	clientOnly: true,
	callback: (...args: unknown[]) => record('command.callback', ...args),
	...extra,
});
const server = (extra: object = {}) => ({
	command: 'giphy',
	result: (...args: unknown[]) => record('command.result', ...args),
	...extra,
});
const ok = (result: unknown = 'r') => ({ '/v1/commands.run': async () => ({ result }) });
const byEndpoint = (handlers: Record<string, (() => Promise<unknown>) | (() => never)>) => async (endpoint: string) =>
	handlers[endpoint]?.() ?? {};

const cases: Case[] = [
	{ name: 'plain text', msg: 'hello' },
	{ name: 'empty text', msg: '' },
	{ name: 'lone slash', msg: '/' },
	{ name: 'slash then space', msg: '/ spaced' },
	{ name: 'leading space', msg: ' /x' },
	{ name: 'unrecognized', msg: '/nope some args' },
	{ name: 'unrecognized with markup', msg: '/<b>x&"\'' },
	{ name: 'unrecognized unicode and newline params', msg: '/nöpe 😀 line1\nline2' },
	{ name: 'double slash', msg: '//' },
	{ name: 'triple slash and text', msg: '///x y' },
	{ name: 'unrecognized in a thread', msg: '/nope', extra: { tmid: 'thread-1' }, chat: { tmid: 'thread-1' } },
	{ name: 'unrecognized without composer', msg: '/nope', chat: { withComposer: false } },
	{
		name: 'unrecognized allowed',
		msg: '/nope',
		setup: () => {
			behavior.settings.Message_AllowUnrecognizedSlashCommand = true;
		},
	},
	{
		name: 'unrecognized allowed setting is a truthy string',
		msg: '/nope',
		setup: () => {
			behavior.settings.Message_AllowUnrecognizedSlashCommand = 'false';
		},
	},
	{
		name: 'unrecognized setting is undefined',
		msg: '/nope',
		setup: () => {
			delete behavior.settings.Message_AllowUnrecognizedSlashCommand;
		},
	},
	{
		name: 'ephemeral push rejects on an unrecognized command',
		msg: '/nope',
		chat: {
			dataOverrides: {
				pushEphemeralMessage: async () => {
					throw new Error('push failed');
				},
			},
		},
	},
	...['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf'].map((name): Case => ({
		name: `inherited name /${name}`,
		msg: `/${name} x`,
	})),
	{
		name: 'inherited name /constructor with run failing',
		msg: '/constructor',
		setup: () => {
			behavior.post = byEndpoint({
				'/v1/commands.run': async () => {
					throw new Error('boom');
				},
			});
		},
	},
	{
		name: 'permission denied',
		msg: '/mute @x',
		setup: () => {
			behavior.commands = { mute: { command: 'mute', permission: 'mute-user' } };
		},
	},
	{
		name: 'permission denied without composer',
		msg: '/mute',
		chat: { withComposer: false },
		setup: () => {
			behavior.commands = { mute: { command: 'mute', permission: 'mute-user' } };
		},
	},
	{
		name: 'permission array',
		msg: '/mute',
		setup: () => {
			behavior.commands = { mute: { command: 'mute', permission: ['mute-user', 'admin'] } };
			behavior.permissions = ['admin'];
		},
	},
	{
		name: 'permission empty string is skipped',
		msg: '/mute',
		setup: () => {
			behavior.commands = { mute: { command: 'mute', permission: '', result: () => record('command.result') } };
		},
	},
	{
		name: 'permission check throws',
		msg: '/mute',
		setup: () => {
			behavior.commands = { mute: { command: 'mute', permission: 'mute-user' } };
			jest.spyOn(authorizationModule, 'hasAtLeastOnePermission').mockImplementation(() => {
				throw new Error('permission boom');
			});
		},
	},
	{
		name: 'permission denied in a thread',
		msg: '/mute',
		extra: { tmid: 'thread-1' },
		chat: { tmid: 'thread-1' },
		setup: () => {
			behavior.commands = { mute: { command: 'mute', permission: 'mute-user' } };
		},
	},
	{
		name: 'client only',
		msg: '/clear all',
		setup: () => {
			behavior.commands = { clear: clientOnly() };
		},
	},
	{
		name: 'client only without callback',
		msg: '/clear',
		setup: () => {
			behavior.commands = { clear: clientOnly({ callback: undefined }) };
		},
	},
	{
		name: 'client only without composer',
		msg: '/clear',
		chat: { withComposer: false },
		setup: () => {
			behavior.commands = { clear: clientOnly() };
		},
	},
	{
		name: 'client only callback throws',
		msg: '/clear',
		setup: () => {
			behavior.commands = {
				clear: clientOnly({
					callback: () => {
						throw new Error('cb boom');
					},
				}),
			};
		},
	},
	{
		name: 'client only without a user id falls through to the server',
		msg: '/clear',
		chat: { uid: undefined },
		setup: () => {
			behavior.commands = { clear: clientOnly({ result: (...args: unknown[]) => record('command.result', ...args) }) };
		},
	},
	{
		name: 'client only with a permission',
		msg: '/clear',
		setup: () => {
			behavior.commands = { clear: clientOnly({ permission: 'x' }) };
			behavior.permissions = ['x'];
		},
	},
	{
		name: 'server command',
		msg: '/giphy cats',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = byEndpoint(ok({ url: 'x' }));
		},
	},
	{
		name: 'server command with unicode and newline params',
		msg: '/giphy gatos 😀\nmás  líneas ',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = byEndpoint(ok());
		},
	},
	{
		name: 'server command params with a leading tab',
		msg: '/giphy\tcats',
		setup: () => {
			behavior.commands = { giphy: server() };
		},
	},
	{
		name: 'server command in a thread',
		msg: '/giphy',
		extra: { tmid: 'thread-1' },
		chat: { tmid: 'thread-1' },
		setup: () => {
			behavior.commands = { giphy: server() };
		},
	},
	{
		name: 'server command with an empty tmid',
		msg: '/giphy',
		extra: { tmid: '' },
		setup: () => {
			behavior.commands = { giphy: server() };
		},
	},
	{
		name: 'app command',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server({ appId: 'app-1' }) };
			behavior.post = byEndpoint(ok());
		},
	},
	{
		name: 'app command run fails',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server({ appId: 'app-1' }) };
			behavior.post = byEndpoint({
				'/v1/commands.run': async () => {
					throw new Error('boom');
				},
			});
		},
	},
	{
		name: 'server command run fails with a non-error',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = byEndpoint({ '/v1/commands.run': () => Promise.reject('plain') });
		},
	},
	{
		name: 'server command run throws synchronously',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = byEndpoint({
				'/v1/commands.run': () => {
					throw new Error('sync boom');
				},
			});
		},
	},
	{
		name: 'result handler throws on success: goes to the catch and reports the error',
		msg: '/giphy',
		setup: () => {
			let first = true;
			behavior.commands = {
				giphy: server({
					result: (...args: unknown[]) => {
						record('command.result', ...args);
						if (first) {
							first = false;
							throw new Error('handler boom');
						}
					},
				}),
			};
		},
	},
	{
		name: 'result handler throws in the catch: rejects and skips idle',
		msg: '/giphy',
		setup: () => {
			behavior.commands = {
				giphy: server({
					appId: 'app-1',
					result: () => {
						throw new Error('handler boom');
					},
				}),
			};
			behavior.post = byEndpoint({ '/v1/commands.run': () => Promise.reject(new Error('run boom')) });
		},
	},
	{
		name: 'warning push rejects after a failed run',
		msg: '/giphy',
		chat: {
			dataOverrides: {
				pushEphemeralMessage: async () => {
					throw new Error('push failed');
				},
			},
		},
		setup: () => {
			behavior.commands = { giphy: server({ appId: 'app-1' }) };
			behavior.post = byEndpoint({ '/v1/commands.run': () => Promise.reject(new Error('run boom')) });
		},
	},
	{
		name: 'server command without a result handler or composer',
		msg: '/giphy',
		chat: { withComposer: false },
		setup: () => {
			behavior.commands = { giphy: { command: 'giphy' } };
		},
	},
	{
		name: 'run resolves without a result field',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = async (endpoint) => (endpoint === '/v1/commands.run' ? {} : {});
		},
	},
	{
		name: 'run resolves undefined: destructuring throws into the catch',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = async () => undefined;
		},
	},
	...([null, 0, '', Number.NaN, {}] as const).map((value): Case => ({
		name: `unrecognized setting is ${typeof value === 'object' && value ? 'an object' : String(value) || "''"}`,
		msg: '/nope',
		setup: () => {
			behavior.settings.Message_AllowUnrecognizedSlashCommand = value;
		},
	})),
	{
		name: 'server command with a tmid of 0',
		msg: '/giphy',
		extra: { tmid: 0 },
		setup: () => {
			behavior.commands = { giphy: server() };
		},
	},
	{
		name: 'client only with a truthy non-boolean flag',
		msg: '/clear',
		setup: () => {
			behavior.commands = { clear: clientOnly({ clientOnly: 'yes' }) };
		},
	},
	{
		name: 'client only with an empty user id falls through to the server',
		msg: '/clear',
		chat: { uid: '' },
		setup: () => {
			behavior.commands = { clear: clientOnly({ result: (...args: unknown[]) => record('command.result', ...args) }) };
		},
	},
	{
		name: 'telemetry rejects with an already-handled rejection: nobody observes it',
		msg: '/giphy',
		setup: () => {
			behavior.commands = { giphy: server() };
			behavior.post = (endpoint) => {
				if (endpoint !== '/v1/statistics.telemetry') {
					return Promise.resolve({ result: 'r' });
				}
				const rejected = Promise.reject(new Error('telemetry boom'));
				rejected.catch(() => undefined);
				const originalThen = rejected.then.bind(rejected);
				rejected.then = ((...args: Parameters<typeof originalThen>) => {
					record('telemetry.then');
					return originalThen(...args);
				}) as typeof rejected.then;
				return rejected;
			};
		},
	},
	{ name: 'message without msg', msg: undefined as unknown as string },
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

const run = async (kind: keyof typeof runners, testCase: Case) => {
	jest.restoreAllMocks();
	jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => record('console.error', ...args));
	resetFakes();
	resetRandom();
	resetStores();
	Rooms.state.store({ _id: 'GENERAL', t: 'c' } as IRoom);
	testCase.setup?.();
	const stop = trackMessagesStore();
	const chat = createGoldenChat(testCase.chat);

	let promise: Promise<boolean>;
	try {
		promise = runners[kind](chat, message(testCase.msg, testCase.extra));
	} catch (error) {
		promise = Promise.reject(error);
	}
	const { outcome, ticks } = await settle(promise);
	stop();

	const normalized =
		outcome?.status === 'rejected'
			? {
					status: 'rejected' as const,
					error: outcome.error instanceof Error ? `${outcome.error.name}: ${outcome.error.message}` : outcome.error,
				}
			: outcome;
	return { outcome: normalized, ticks, log: getCalls(), store: [...Messages.state.records.values()] };
};

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
});

describe('processSlashCommand differential: frozen legacy copy vs adapter vs core', () => {
	it.each(cases.map((c) => [c.name, c] as const))('%s', async (_name, testCase) => {
		const legacy = await run('legacy', testCase);
		const adapter = await run('adapter', testCase);
		const core = await run('core', testCase);

		expect(legacy.outcome).toBeDefined();
		expect(adapter).toEqual(legacy);
		expect(core).toEqual(legacy);
	});

	it('covers every golden outcome class: a true, a false and a rejection are all present in the table', async () => {
		const outcomes = new Set<string>();
		for (const testCase of cases) {
			const { outcome } = await run('legacy', testCase);
			outcomes.add(outcome?.status === 'resolved' ? String(outcome.value) : 'rejected');
		}
		expect([...outcomes].sort()).toEqual(['false', 'rejected', 'true']);
	});

	it('keeps the pinned quirks in the legacy oracle itself', async () => {
		const constructorRun = await run('legacy', { name: 'c', msg: '/constructor' });
		expect(constructorRun.log.at(-1)).toEqual(['sdk.rest.post', '/v1/commands.run', { command: undefined, params: '', roomId: 'GENERAL' }]);

		const doubleSlash = await run('legacy', { name: 'd', msg: '//' });
		expect(doubleSlash.log[2]).toEqual(['console.error', 'No_such_command {"command":"/"}']);
	});

	it('never observes the telemetry promise, in the old code or the new', async () => {
		const testCase = cases.find((c) => c.name.startsWith('telemetry rejects'));
		expect(testCase).toBeDefined();
		if (!testCase) {
			return;
		}
		for (const kind of ['legacy', 'adapter', 'core'] as const) {
			const { log } = await run(kind, testCase);
			expect(log.some(([fn]) => fn === 'telemetry.then')).toBe(false);
		}
	});

	it.each([
		['unrecognized', '/nope'],
		['server', '/giphy'],
		['non-command', 'hello'],
		['denied', '/mute'],
	])('settles on the same microtask tick as the old async function: %s', async (_name, msg) => {
		const testCase: Case = {
			name: msg,
			msg,
			setup: () => {
				behavior.commands = { giphy: server(), mute: { command: 'mute', permission: 'x' } };
			},
		};
		const legacy = await run('legacy', testCase);
		const adapter = await run('adapter', testCase);
		const core = await run('core', testCase);

		expect(legacy.ticks).toBeLessThan(100);
		expect(adapter.ticks).toBe(legacy.ticks);
		expect(core.ticks).toBe(legacy.ticks);
	});
});
