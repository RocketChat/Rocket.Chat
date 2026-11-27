import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { processSlashCommand } from './processSlashCommand';
import { Messages, Rooms } from '../../../stores';
import { createGoldenChat, resetStores, trackMessagesStore } from '../goldenChat';
import { NOW, behavior, getCalls, record, resetFakes, resetRandom } from '../goldenFakes';

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

const ephemeral = (msg: string, extra: object = {}) => ({
	_id: 'random-1',
	ts: NOW,
	msg,
	u: { _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket.Cat' },
	private: true,
	_updatedAt: NOW,
	...extra,
});

const postByEndpoint =
	(handlers: Record<string, () => Promise<unknown>>) =>
	async (endpoint: string): Promise<unknown> =>
		handlers[endpoint]?.() ?? {};

let stopTracking: () => void;

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
	resetFakes();
	resetRandom();
	resetStores();
	Rooms.state.store({ _id: 'GENERAL', t: 'c' } as IRoom);
	jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => record('console.error', ...args));
	stopTracking = trackMessagesStore();
});

afterEach(() => {
	stopTracking();
	jest.restoreAllMocks();
	jest.useRealTimers();
});

describe('processSlashCommand golden: text that is not a command', () => {
	it.each([['hello'], [' /leading-space'], ['/'], ['/ spaced'], ['']])('returns false without any call for %j', async (msg) => {
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message(msg))).resolves.toBe(false);

		expect(getCalls()).toEqual([]);
	});
});

describe('processSlashCommand golden: unrecognized command', () => {
	it('clears, logs and pushes an ephemeral rocket.cat message when unrecognized commands are not allowed', async () => {
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('/nope some args'))).resolves.toBe(true);

		const text = 'No_such_command {"command":"nope"}';
		expect(getCalls()).toEqual([
			['settings.peek', 'Message_AllowUnrecognizedSlashCommand'],
			['chat.composer.clear'],
			['console.error', text],
			['chat.data.pushEphemeralMessage', ephemeral(text)],
			['Messages.store', { ...ephemeral(text), rid: 'GENERAL' }],
		]);
		expect([...Messages.state.records.values()]).toEqual([{ ...ephemeral(text), rid: 'GENERAL' }]);
	});

	it('escapes the command name in the warning', async () => {
		const chat = createGoldenChat();

		await processSlashCommand(chat, message('/<b>x'));

		expect(getCalls()[2]).toEqual(['console.error', 'No_such_command {"command":"&lt;b&gt;x"}']);
	});

	it('treats a lone double slash as the command named "/"', async () => {
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('//'))).resolves.toBe(true);

		expect(getCalls()[2]).toEqual(['console.error', 'No_such_command {"command":"/"}']);
	});

	it('scopes the ephemeral message to the thread and upserts the thread cache', async () => {
		const chat = createGoldenChat({ tmid: 'thread-1' });
		const text = 'No_such_command {"command":"nope"}';
		const pushed = { ...ephemeral(text), rid: 'GENERAL', tmid: 'thread-1' };

		await processSlashCommand(chat, message('/nope', { tmid: 'thread-1' }));

		expect(getCalls().slice(3)).toEqual([
			['chat.data.pushEphemeralMessage', ephemeral(text)],
			['Messages.store', pushed],
			['upsertThreadMessageInCache', pushed, 'GENERAL', 'thread-1'],
		]);
	});

	it('returns false and touches nothing else when unrecognized commands are allowed', async () => {
		behavior.settings.Message_AllowUnrecognizedSlashCommand = true;
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('/nope'))).resolves.toBe(false);

		expect(getCalls()).toEqual([['settings.peek', 'Message_AllowUnrecognizedSlashCommand']]);
	});

	it('resolves an inherited property name as a command: /constructor runs a command with undefined fields', async () => {
		behavior.post = postByEndpoint({ '/v1/commands.run': async () => ({ result: 'ok' }) });
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('/constructor'))).resolves.toBe(true);

		expect(getCalls()).toEqual([
			[
				'sdk.rest.post',
				'/v1/statistics.telemetry',
				{ params: [{ eventName: 'slashCommandsStats', timestamp: NOW.getTime(), command: undefined }] },
			],
			['chat.ActionManager.generateTriggerId', undefined],
			['chat.composer.clear'],
			['sdk.rest.post', '/v1/commands.run', { command: undefined, params: '', roomId: 'GENERAL' }],
		]);
	});
});

describe('processSlashCommand golden: permission', () => {
	const mute = { command: 'mute', permission: 'mute-user' };

	it('denies a command the user lacks the permission for, with an ephemeral warning and no request', async () => {
		behavior.commands = { mute };
		const chat = createGoldenChat();
		const text = 'You_do_not_have_permission_to_execute_this_command {"command":"mute"}';

		await expect(processSlashCommand(chat, message('/mute @x'))).resolves.toBe(true);

		expect(getCalls()).toEqual([
			['hasAtLeastOnePermission', 'mute-user', 'GENERAL'],
			['chat.composer.clear'],
			['console.error', text],
			['chat.data.pushEphemeralMessage', ephemeral(text)],
			['Messages.store', { ...ephemeral(text), rid: 'GENERAL' }],
		]);
	});

	it('passes an array of permissions as is', async () => {
		behavior.commands = { mute: { ...mute, permission: ['mute-user', 'admin'] } };
		const chat = createGoldenChat();

		await processSlashCommand(chat, message('/mute'));

		expect(getCalls()[0]).toEqual(['hasAtLeastOnePermission', ['mute-user', 'admin'], 'GENERAL']);
	});

	it('runs the command when the user has the permission', async () => {
		behavior.commands = { mute };
		behavior.permissions = ['mute-user'];
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('/mute @x'))).resolves.toBe(true);

		expect(getCalls().slice(0, 1)).toEqual([['hasAtLeastOnePermission', 'mute-user', 'GENERAL']]);
		expect(getCalls().at(-1)).toEqual(['sdk.rest.post', '/v1/commands.run', { command: 'mute', params: ' @x', roomId: 'GENERAL' }]);
	});
});

describe('processSlashCommand golden: client-only commands', () => {
	const clientOnly = (extra: object = {}) => ({
		command: 'clear',
		clientOnly: true,
		callback: (...args: unknown[]) => record('command.callback', ...args),
		...extra,
	});

	it('clears the composer and runs the callback on the client, with no request', async () => {
		behavior.commands = { clear: clientOnly() };
		const chat = createGoldenChat();
		const msg = message('/clear all');

		await expect(processSlashCommand(chat, msg)).resolves.toBe(true);

		expect(getCalls()).toEqual([
			['chat.composer.clear'],
			['command.callback', { command: 'clear', message: msg, params: ' all', userId: 'uid1' }],
		]);
	});

	it('falls through to the server when there is no user id', async () => {
		behavior.commands = { clear: clientOnly() };
		const chat = createGoldenChat({ uid: undefined });

		await expect(processSlashCommand(chat, message('/clear'))).resolves.toBe(true);

		expect(getCalls().map(([fn]) => fn)).toEqual([
			'sdk.rest.post',
			'chat.ActionManager.generateTriggerId',
			'chat.composer.clear',
			'sdk.rest.post',
		]);
	});

	it('clears even when the command has no client callback', async () => {
		behavior.commands = { clear: clientOnly({ callback: undefined }) };
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('/clear'))).resolves.toBe(true);

		expect(getCalls()).toEqual([['chat.composer.clear']]);
	});
});

describe('processSlashCommand golden: server commands', () => {
	const server = (extra: object = {}) => ({
		command: 'giphy',
		result: (...args: unknown[]) => record('command.result', ...args),
		...extra,
	});

	it('posts telemetry, clears, runs the command and hands the result to the command', async () => {
		behavior.commands = { giphy: server() };
		behavior.post = postByEndpoint({ '/v1/commands.run': async () => ({ result: { url: 'x' } }) });
		const chat = createGoldenChat();
		const msg = message('/giphy cats');

		await expect(processSlashCommand(chat, msg)).resolves.toBe(true);

		expect(getCalls()).toEqual([
			[
				'sdk.rest.post',
				'/v1/statistics.telemetry',
				{ params: [{ eventName: 'slashCommandsStats', timestamp: NOW.getTime(), command: 'giphy' }] },
			],
			['chat.ActionManager.generateTriggerId', undefined],
			['chat.composer.clear'],
			['sdk.rest.post', '/v1/commands.run', { command: 'giphy', params: ' cats', roomId: 'GENERAL' }],
			['command.result', undefined, { url: 'x' }, { cmd: 'giphy', params: ' cats', msg, userId: 'uid1' }],
		]);
	});

	it('adds tmid for a thread message', async () => {
		behavior.commands = { giphy: server() };
		const chat = createGoldenChat({ tmid: 'thread-1' });

		await processSlashCommand(chat, message('/giphy', { tmid: 'thread-1' }));

		expect(getCalls().find(([fn, endpoint]) => fn === 'sdk.rest.post' && endpoint === '/v1/commands.run')).toEqual([
			'sdk.rest.post',
			'/v1/commands.run',
			{ command: 'giphy', params: '', roomId: 'GENERAL', tmid: 'thread-1' },
		]);
	});

	it('brackets an app command with busy and idle and sends its trigger id', async () => {
		behavior.commands = { giphy: server({ appId: 'app-1' }) };
		behavior.post = postByEndpoint({ '/v1/commands.run': async () => ({ result: 'r' }) });
		const chat = createGoldenChat();
		const msg = message('/giphy');

		await processSlashCommand(chat, msg);

		expect(getCalls()).toEqual([
			[
				'sdk.rest.post',
				'/v1/statistics.telemetry',
				{ params: [{ eventName: 'slashCommandsStats', timestamp: NOW.getTime(), command: 'giphy' }] },
			],
			['chat.ActionManager.generateTriggerId', 'app-1'],
			['chat.ActionManager.notifyBusy'],
			['chat.composer.clear'],
			['sdk.rest.post', '/v1/commands.run', { command: 'giphy', params: '', roomId: 'GENERAL', triggerId: 'trigger-app-1' }],
			['command.result', undefined, 'r', { cmd: 'giphy', params: '', msg, userId: 'uid1' }],
			['chat.ActionManager.notifyIdle'],
		]);
	});

	it('warns and reports the error to the command when the run fails, then still goes idle', async () => {
		const failure = new Error('boom');
		behavior.commands = { giphy: server({ appId: 'app-1' }) };
		behavior.post = postByEndpoint({
			'/v1/commands.run': async () => {
				throw failure;
			},
		});
		const chat = createGoldenChat();
		const msg = message('/giphy');
		const text = 'Something_went_wrong_while_executing_command {"command":"giphy"}';

		await expect(processSlashCommand(chat, msg)).resolves.toBe(true);

		expect(getCalls().slice(3)).toEqual([
			['chat.composer.clear'],
			['sdk.rest.post', '/v1/commands.run', { command: 'giphy', params: '', roomId: 'GENERAL', triggerId: 'trigger-app-1' }],
			['console.error', text],
			['chat.data.pushEphemeralMessage', ephemeral(text)],
			['Messages.store', { ...ephemeral(text), rid: 'GENERAL' }],
			['command.result', failure, undefined, { cmd: 'giphy', params: '', msg, userId: 'uid1' }],
			['chat.ActionManager.notifyIdle'],
		]);
	});

	it('runs a command with no result handler', async () => {
		behavior.commands = { giphy: { command: 'giphy' } };
		const chat = createGoldenChat();

		await expect(processSlashCommand(chat, message('/giphy'))).resolves.toBe(true);

		expect(getCalls().map(([fn]) => fn)).toEqual([
			'sdk.rest.post',
			'chat.ActionManager.generateTriggerId',
			'chat.composer.clear',
			'sdk.rest.post',
		]);
	});

	it('does not need a composer', async () => {
		behavior.commands = { giphy: server() };
		const chat = createGoldenChat({ withComposer: false });

		await processSlashCommand(chat, message('/giphy'));

		expect(getCalls().map(([fn]) => fn)).toEqual([
			'sdk.rest.post',
			'chat.ActionManager.generateTriggerId',
			'sdk.rest.post',
			'command.result',
		]);
	});
});
