import type { IOutgoingIntegration, IUser } from '@rocket.chat/core-typings';
import { Integrations, Messages, Rooms, Users } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';
import { Response } from 'node-fetch';

import { triggerHandler as sharedTriggerHandler } from './triggerHandler';
import { updateHistory } from './updateHistory';
import { makeHistory, makeIntegration, makeMessage, makeRoom, makeUser } from '../../../../tests/mocks/utils/outgoingIntegration';
import { settings } from '../../../settings';
import { processWebhookMessage } from '../../messages/processWebhookMessage';
import { notifyOnIntegrationChangedById } from '../../notifyListener';
import { getRoomByNameOrIdWithOptionToJoin } from '../../rooms/getRoomByNameOrIdWithOptionToJoin';

jest.mock('meteor/meteor', () => ({ Meteor: { Error: class extends Error {} } }), { virtual: true });
jest.mock('@rocket.chat/models', () => ({
	Integrations: { updateOne: jest.fn() },
	Users: { findOneByUsernameIgnoringCase: jest.fn(), findOneById: jest.fn() },
	Rooms: { findOneById: jest.fn() },
	Messages: { findOneById: jest.fn() },
}));
jest.mock('@rocket.chat/server-fetch', () => ({ serverFetch: jest.fn() }));
jest.mock('./isolated-vm/isolated-vm', () => ({
	IsolatedVMScriptEngine: class {
		public prepareOutgoingRequest = jest.fn();

		public processOutgoingResponse = jest.fn();
	},
}));
jest.mock('./updateHistory', () => ({ updateHistory: jest.fn() }));
jest.mock('../../../settings', () => ({ settings: { get: jest.fn() } }));
jest.mock('../../messages/processWebhookMessage', () => ({ processWebhookMessage: jest.fn() }));
jest.mock('../../notifyListener', () => ({ notifyOnIntegrationChangedById: jest.fn() }));
jest.mock('../../rooms/getRoomByNameOrIdWithOptionToJoin', () => ({ getRoomByNameOrIdWithOptionToJoin: jest.fn() }));

const SITE_URL = 'https://rocket.example';

// executeTriggerUrl never awaits its fetch(...).then(...) chain, so tests must drain it explicitly.
const settle = async () => {
	for (let i = 0; i < 20; i++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
};

let triggerHandler: typeof sharedTriggerHandler;
let engine: jest.MockedObjectDeep<ReturnType<typeof sharedTriggerHandler.getEngine>>;

beforeEach(() => {
	jest.resetAllMocks();
	// setImmediate must stay real for settle() to drain that chain while retries control setTimeout.
	jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });

	triggerHandler = new (sharedTriggerHandler.constructor as new () => typeof sharedTriggerHandler)();
	engine = jest.mocked(triggerHandler.getEngine(undefined), { shallow: false });

	jest.mocked(settings.get).mockImplementation((key: string) => (key === 'Site_Url' ? SITE_URL : undefined));
	jest.mocked(Users.findOneByUsernameIgnoringCase).mockResolvedValue(makeUser({ _id: 'bot-user', username: 'rocket.cat' }));
	jest.mocked(processWebhookMessage).mockResolvedValue([{ channel: '#room-1', message: { _id: 'sent-1' } }] as any);
	engine.prepareOutgoingRequest.mockImplementation(async ({ url, data }) => ({
		params: {},
		method: 'POST',
		url,
		data,
		auth: undefined,
		headers: { 'User-Agent': 'rocket.chat-test' },
	}));
	jest
		.mocked(serverFetch)
		.mockImplementation(async () => new Response('{"text":"from webhook"}', { headers: { 'Content-Type': 'application/json' } }));
});

afterEach(() => {
	jest.useRealTimers();
});

const historySteps = () => jest.mocked(updateHistory).mock.calls.map(([arg]) => arg.step);
const historyCall = (step: string) =>
	jest
		.mocked(updateHistory)
		.mock.calls.map(([arg]) => arg)
		.find((arg) => arg.step === step);
const fetchedUrls = () => jest.mocked(serverFetch).mock.calls.map(([url]) => url);
const fetchOptions = (call = 0) => jest.mocked(serverFetch).mock.calls[call][1] as Record<string, any>;

const integrationOn = (id: string, channel: string, overrides: Partial<IOutgoingIntegration> = {}) =>
	makeIntegration({ _id: id, urls: [`https://hooks.example/${id}`], channel: [channel], ...overrides });

const register = (overrides: Partial<IOutgoingIntegration> = {}) => {
	const integration = makeIntegration(overrides);
	triggerHandler.addIntegration(integration);
	return integration;
};

const runUrl = async (integration: IOutgoingIntegration, args: Record<string, any> = {}, tries = 0) => {
	await triggerHandler.executeTriggerUrl(
		'https://hooks.example/one',
		integration,
		{ event: 'sendMessage', message: makeMessage(), room: makeRoom(), ...args },
		tries,
	);
	await settle();
};

const mapped = (args: Parameters<typeof sharedTriggerHandler.mapEventArgsToData>[1]) => {
	const data: Record<string, any> = { token: 'tok', bot: false };
	triggerHandler.mapEventArgsToData(data as any, args);
	return data;
};

describe('addIntegration', () => {
	// Private groups and DMs belong to no channel bucket, so only __any can explain these runs.
	it('runs an integration whose event does not use channels in any room', async () => {
		triggerHandler.addIntegration(makeIntegration({ event: 'roomArchived', channel: ['#somewhere-else'] }));

		await triggerHandler.executeTriggers('roomArchived', makeRoom({ _id: 'unrelated', name: 'unrelated', t: 'p' }), makeUser());
		await triggerHandler.executeTriggers('roomArchived', makeRoom({ _id: 'dm-1', t: 'd', name: undefined }), makeUser());
		await settle();

		expect(serverFetch).toHaveBeenCalledTimes(2);
	});

	it('registers an integration without channels on public channels only', async () => {
		triggerHandler.addIntegration(makeIntegration({ channel: [] }));

		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'c', _id: 'public-1', name: 'public-1' }));
		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'p', _id: 'private-1', name: 'private-1' }));
		await settle();

		expect(serverFetch).toHaveBeenCalledTimes(1);
	});

	it('registers an integration under each configured channel only', async () => {
		triggerHandler.addIntegration(integrationOn('list', '#alpha', { channel: ['#alpha', '#beta'] }));
		triggerHandler.addIntegration(integrationOn('string', '#gamma', { channel: '#gamma' as unknown as string[] }));

		for (const name of ['alpha', 'beta', 'gamma', 'zulu']) {
			await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'c', _id: `r-${name}`, name }));
		}
		await settle();

		expect(fetchedUrls()).toEqual(['https://hooks.example/list', 'https://hooks.example/list', 'https://hooks.example/string']);
	});
});

describe('removeIntegration', () => {
	it('removes an integration from every channel it was registered on, leaving the others', async () => {
		const removed = integrationOn('removed', '#alpha', { channel: ['#alpha', '#beta'] });
		triggerHandler.addIntegration(integrationOn('kept', '#alpha'));
		triggerHandler.addIntegration(removed);
		triggerHandler.removeIntegration(removed);

		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'c', _id: 'r-a', name: 'alpha' }));
		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'c', _id: 'r-b', name: 'beta' }));
		await settle();

		expect(fetchedUrls()).toEqual(['https://hooks.example/kept']);
		expect(triggerHandler.isTriggerEnabled(removed)).toBe(false);
	});
});

describe('trigger selection', () => {
	it('selects direct-message integrations by global bucket, participant id and recipient username, excluding the sender', async () => {
		triggerHandler.addIntegration(integrationOn('global', 'all_direct_messages'));
		triggerHandler.addIntegration(integrationOn('uid', '@user-2'));
		triggerHandler.addIntegration(integrationOn('recipient', '@recipient'));
		triggerHandler.addIntegration(integrationOn('sender', '@sender'));
		triggerHandler.addIntegration(integrationOn('stranger', '@stranger'));

		await triggerHandler.executeTriggers(
			'sendMessage',
			makeMessage({ u: { _id: 'user-1', username: 'sender' } }),
			makeRoom({ t: 'd', _id: 'dm-1', name: undefined, uids: ['user-1', 'user-2'], usernames: ['sender', 'recipient'] }),
		);
		await settle();

		expect(fetchedUrls().sort()).toEqual(['https://hooks.example/global', 'https://hooks.example/recipient', 'https://hooks.example/uid']);
	});

	it('selects public-channel integrations by global bucket, room id and room name, once each', async () => {
		triggerHandler.addIntegration(integrationOn('global', 'all_public_channels'));
		triggerHandler.addIntegration(integrationOn('id', '#room-1'));
		triggerHandler.addIntegration(integrationOn('name', '#general'));
		triggerHandler.addIntegration(integrationOn('every-bucket', '', { channel: ['all_public_channels', '#room-1', '#general'] }));
		triggerHandler.addIntegration(integrationOn('private', 'all_private_groups'));

		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'c', _id: 'room-1', name: 'general' }));
		await settle();

		expect(fetchedUrls().sort()).toEqual([
			'https://hooks.example/every-bucket',
			'https://hooks.example/global',
			'https://hooks.example/id',
			'https://hooks.example/name',
		]);
	});

	it('selects private-group integrations by global bucket, room id and room name', async () => {
		triggerHandler.addIntegration(integrationOn('global', 'all_private_groups'));
		triggerHandler.addIntegration(integrationOn('id', '#group-1'));
		triggerHandler.addIntegration(integrationOn('name', '#secret'));
		triggerHandler.addIntegration(integrationOn('public', 'all_public_channels'));

		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom({ t: 'p', _id: 'group-1', name: 'secret' }));
		await settle();

		expect(fetchedUrls().sort()).toEqual(['https://hooks.example/global', 'https://hooks.example/id', 'https://hooks.example/name']);
	});
});

describe('executeTriggers', () => {
	it('executes only enabled integrations whose event matches, once per configured url', async () => {
		triggerHandler.addIntegration(makeIntegration({ _id: 'match', urls: ['https://hooks.example/a', 'https://hooks.example/b'] }));
		triggerHandler.addIntegration(integrationOn('disabled', 'all_public_channels', { enabled: false }));
		triggerHandler.addIntegration(integrationOn('other-event', 'all_public_channels', { event: 'fileUploaded' }));

		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom());
		await settle();

		expect(fetchedUrls()).toEqual(['https://hooks.example/a', 'https://hooks.example/b']);
	});

	it('does nothing for an integration without urls', async () => {
		triggerHandler.addIntegration(makeIntegration({ urls: undefined }));

		await triggerHandler.executeTriggers('sendMessage', makeMessage(), makeRoom());
		await settle();

		expect(serverFetch).not.toHaveBeenCalled();
		expect(updateHistory).not.toHaveBeenCalled();
	});
});

describe('eventNameArgumentsToObject', () => {
	it('converts the arguments of every supported event', () => {
		const message = makeMessage();
		const room = makeRoom();
		const user = makeUser();

		expect(triggerHandler.eventNameArgumentsToObject('sendMessage', message, room)).toEqual({ event: 'sendMessage', message, room });
		expect(triggerHandler.eventNameArgumentsToObject('fileUploaded', { user, room, message })).toEqual({
			event: 'fileUploaded',
			message,
			room,
			user,
		});
		expect(triggerHandler.eventNameArgumentsToObject('roomArchived', room, user)).toEqual({ event: 'roomArchived', room, user });
		expect(triggerHandler.eventNameArgumentsToObject('roomCreated', user, room)).toEqual({ event: 'roomCreated', owner: user, room });
		expect(triggerHandler.eventNameArgumentsToObject('roomJoined', user, room)).toEqual({ event: 'roomJoined', user, room });
		expect(triggerHandler.eventNameArgumentsToObject('roomLeft', { user }, room)).toEqual({ event: 'roomLeft', user, room });
		expect(triggerHandler.eventNameArgumentsToObject('userCreated', user)).toEqual({ event: 'userCreated', user });
	});

	it('drops context when arguments are missing and discards unsupported events', () => {
		expect(triggerHandler.eventNameArgumentsToObject('sendMessage', makeMessage())).toEqual({ event: 'sendMessage' });
		expect(triggerHandler.eventNameArgumentsToObject('roomCreated', makeUser())).toEqual({ event: 'roomCreated' });
		expect(triggerHandler.eventNameArgumentsToObject('userCreated')).toEqual({ event: 'userCreated' });
		expect(triggerHandler.eventNameArgumentsToObject('somethingElse', makeMessage(), makeRoom())).toEqual({ event: undefined });
	});
});

describe('mapEventArgsToData', () => {
	it('maps the sendMessage payload without optional fields the message lacks', () => {
		const message = makeMessage({ msg: 'hi there' });

		const data = mapped({ event: 'sendMessage', message, room: makeRoom() });

		expect(data).toStrictEqual({
			token: 'tok',
			bot: false,
			channel_id: 'room-1',
			channel_name: 'general',
			message_id: 'message-1',
			timestamp: message.ts,
			user_id: 'user-1',
			user_name: 'sender',
			text: 'hi there',
			siteUrl: SITE_URL,
		});
	});

	it('maps alias, bot, edited and thread fields when the message has them', () => {
		const message = makeMessage({
			alias: 'Alias Name',
			bot: { i: 'other' },
			editedAt: new Date('2024-01-03T00:00:00.000Z'),
			tmid: 'thread-1',
		});

		expect(mapped({ event: 'sendMessage', message, room: makeRoom() })).toMatchObject({
			alias: 'Alias Name',
			bot: true,
			isEdited: true,
			tmid: 'thread-1',
		});
	});

	it('maps the fileUploaded payload', () => {
		const room = makeRoom();
		const message = makeMessage({ msg: 'a file', alias: 'Uploader', bot: { i: 'x' } });
		const user = makeUser();

		const data = mapped({ event: 'fileUploaded', message, room, user });

		expect(data).toMatchObject({
			channel_id: 'room-1',
			channel_name: 'general',
			message_id: 'message-1',
			timestamp: message.ts,
			user_id: 'user-1',
			user_name: 'sender',
			text: 'a file',
			user,
			room,
			message,
			alias: 'Uploader',
			bot: true,
		});
		expect(data).not.toHaveProperty('siteUrl');
	});

	it('maps the roomCreated payload from the owner', () => {
		const room = makeRoom();
		const owner = makeUser({ _id: 'owner-9', username: 'creator' });

		expect(mapped({ event: 'roomCreated', message: makeMessage(), room, owner })).toMatchObject({
			channel_id: 'room-1',
			channel_name: 'general',
			timestamp: room.ts,
			user_id: 'owner-9',
			user_name: 'creator',
			owner,
			room,
		});
	});

	it('maps room event payloads from the user', () => {
		const room = makeRoom();
		const user = makeUser({ _id: 'user-7', username: 'joiner' });

		for (const event of ['roomArchived', 'roomJoined', 'roomLeft'] as const) {
			const data = mapped({ event, message: makeMessage(), room, user });

			expect(data).toMatchObject({
				channel_id: 'room-1',
				channel_name: 'general',
				user_id: 'user-7',
				user_name: 'joiner',
				user,
				room,
				bot: false,
			});
			expect(data.timestamp).toBeInstanceOf(Date);
		}
	});

	it('maps the userCreated payload', () => {
		const user = makeUser({ _id: 'user-7', username: 'newbie' });

		const data = mapped({ event: 'userCreated', message: makeMessage(), room: makeRoom(), user });

		expect(data).toMatchObject({ timestamp: user.createdAt, user_id: 'user-7', user_name: 'newbie', user });
		expect(data).not.toHaveProperty('channel_id');
	});

	it('flags bot users on room and user events', () => {
		const bot = makeUser({ type: 'bot' });

		expect(mapped({ event: 'roomJoined', message: makeMessage(), room: makeRoom(), user: bot }).bot).toBe(true);
		expect(mapped({ event: 'userCreated', message: makeMessage(), room: makeRoom(), user: bot }).bot).toBe(true);
	});

	it('strips the services field from the user and owner before they reach the payload', () => {
		const services = { password: { bcrypt: 'super-secret-hash' } };
		const plainUser = makeUser();

		const withUser = mapped({
			event: 'fileUploaded',
			message: makeMessage(),
			room: makeRoom(),
			user: { ...makeUser(), services } as IUser,
		});
		const withOwner = mapped({
			event: 'roomCreated',
			message: makeMessage(),
			room: makeRoom(),
			owner: { ...makeUser(), services } as IUser,
		});
		const untouched = mapped({ event: 'fileUploaded', message: makeMessage(), room: makeRoom(), user: plainUser });

		expect(withUser.user).not.toHaveProperty('services');
		expect(withOwner.owner).not.toHaveProperty('services');
		expect(JSON.stringify([withUser, withOwner])).not.toContain('super-secret-hash');
		expect(untouched.user).toBe(plainUser);
	});

	it('maps nothing when the event lacks the context it needs', () => {
		const message = makeMessage();
		const room = makeRoom();
		const user = makeUser();

		const incomplete: Parameters<typeof sharedTriggerHandler.mapEventArgsToData>[1][] = [
			{ event: 'roomCreated', message, room },
			{ event: 'roomArchived', message, room },
			{ event: 'roomJoined', message, room },
			{ event: 'roomLeft', message, room },
			{ event: 'userCreated', message, room },
			{ event: 'sendMessage', room, user, owner: user },
			{ event: 'roomCreated', room, owner: user },
			{ event: 'userCreated', room, user },
			{ event: 'sendMessage', message },
		];

		for (const args of incomplete) {
			expect(mapped(args)).toEqual({ token: 'tok', bot: false });
		}
	});
});

describe('sendMessage', () => {
	const outgoing = (channel = '') => ({ channel, message: { msg: 'response' } }) as any;

	it('sends as the impersonated user', async () => {
		const impersonated = makeUser({ username: 'sender' });
		jest.mocked(Users.findOneByUsernameIgnoringCase).mockResolvedValue(impersonated);

		await triggerHandler.sendMessage({
			trigger: makeIntegration({ impersonateUser: true }),
			room: makeRoom(),
			message: outgoing(),
			data: { bot: false, user_name: 'sender' },
		});

		expect(jest.mocked(Users.findOneByUsernameIgnoringCase).mock.calls).toEqual([['sender']]);
		expect(processWebhookMessage).toHaveBeenCalledWith(expect.anything(), impersonated, expect.anything());
	});

	it('falls back to the integration user when the impersonated user does not exist', async () => {
		jest.mocked(Users.findOneByUsernameIgnoringCase).mockResolvedValueOnce(null);

		const result = await triggerHandler.sendMessage({
			trigger: makeIntegration({ impersonateUser: true, username: 'rocket.cat' }),
			room: makeRoom(),
			message: outgoing(),
			data: { bot: false, user_name: 'ghost' },
		});

		expect(jest.mocked(Users.findOneByUsernameIgnoringCase).mock.calls).toEqual([['ghost'], ['rocket.cat']]);
		expect(result).toEqual([{ channel: '#room-1', message: { _id: 'sent-1' } }]);
	});

	it('sends nothing when the integration user does not exist', async () => {
		jest.mocked(Users.findOneByUsernameIgnoringCase).mockResolvedValue(null);

		const result = await triggerHandler.sendMessage({
			trigger: makeIntegration(),
			room: makeRoom(),
			message: outgoing(),
			data: { bot: false },
		});

		expect(result).toBeUndefined();
		expect(processWebhookMessage).not.toHaveBeenCalled();
	});

	it('resolves the destination from the supplied name, then the message channel, then the target room', async () => {
		jest.mocked(getRoomByNameOrIdWithOptionToJoin).mockResolvedValue(makeRoom());
		const trigger = makeIntegration({ targetRoom: '#target' });

		await triggerHandler.sendMessage({ trigger, nameOrId: '#explicit', message: outgoing('#from-message'), data: { bot: false } });
		await triggerHandler.sendMessage({ trigger, message: outgoing('#from-message'), data: { bot: false } });
		await triggerHandler.sendMessage({ trigger, message: outgoing(), data: { bot: false } });

		expect(jest.mocked(getRoomByNameOrIdWithOptionToJoin).mock.calls.map(([arg]) => [arg.nameOrId, arg.errorOnEmpty])).toEqual([
			['#explicit', false],
			['#from-message', false],
			['#target', false],
		]);
	});

	it('falls back to the supplied room when no destination resolves or none is configured', async () => {
		const room = makeRoom({ _id: 'fallback-room' });

		await triggerHandler.sendMessage({ trigger: makeIntegration(), room, message: outgoing('#missing'), data: { bot: false } });
		await triggerHandler.sendMessage({ trigger: makeIntegration(), room, message: outgoing(), data: { bot: false } });

		expect(getRoomByNameOrIdWithOptionToJoin).toHaveBeenCalledTimes(1);
		expect(jest.mocked(processWebhookMessage).mock.calls.map(([, , defaults]) => defaults?.channel)).toEqual([
			'#fallback-room',
			'#fallback-room',
		]);
	});

	it('sends nothing when no room is available at all', async () => {
		const result = await triggerHandler.sendMessage({ trigger: makeIntegration(), message: outgoing(), data: { bot: false } });

		expect(result).toBeUndefined();
		expect(processWebhookMessage).not.toHaveBeenCalled();
	});

	it('tags the message with the integration and passes its defaults, addressing direct messages with @', async () => {
		const message = outgoing();

		await triggerHandler.sendMessage({
			trigger: makeIntegration({ _id: 'integration-42', alias: 'Robot', avatar: 'https://avatar.example/a.png', emoji: ':robot:' }),
			room: makeRoom({ _id: 'dm-1', t: 'd' }),
			message,
			data: { bot: false },
		});

		expect(message.bot).toEqual({ i: 'integration-42' });
		expect(processWebhookMessage).toHaveBeenCalledWith(message, expect.anything(), {
			alias: 'Robot',
			avatar: 'https://avatar.example/a.png',
			emoji: ':robot:',
			channel: '@dm-1',
		});
	});

	it('defaults alias, avatar and emoji to empty strings, addressing channels with #', async () => {
		await triggerHandler.sendMessage({ trigger: makeIntegration(), room: makeRoom(), message: outgoing(), data: { bot: false } });

		expect(processWebhookMessage).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
			alias: '',
			avatar: '',
			emoji: '',
			channel: '#room-1',
		});
	});
});

describe('executeTriggerUrl', () => {
	it('does nothing when the integration is not enabled', async () => {
		await runUrl(register({ enabled: false }));

		expect(updateHistory).not.toHaveBeenCalled();
		expect(serverFetch).not.toHaveBeenCalled();
	});

	it('runs when a trigger word starts the message, or appears anywhere when that is allowed', async () => {
		const atStart = register({ _id: 'at-start', triggerWords: ['deploy'] });
		const anywhere = register({ _id: 'anywhere', triggerWords: ['deploy'], triggerWordAnywhere: true });

		await runUrl(atStart, { message: makeMessage({ msg: 'deploy it' }) });
		await runUrl(atStart, { message: makeMessage({ msg: 'please deploy it' }) });
		await runUrl(anywhere, { message: makeMessage({ msg: 'please deploy it' }) });
		await runUrl(anywhere, { message: makeMessage({ msg: 'nothing to see' }) });

		expect(serverFetch).toHaveBeenCalledTimes(2);
		expect(
			jest
				.mocked(updateHistory)
				.mock.calls.filter(([arg]) => arg.step === 'mapped-args-to-data')
				.map(([arg]) => arg.triggerWord),
		).toEqual(['deploy', 'deploy']);
	});

	it('ignores trigger words for events that do not use them', async () => {
		await runUrl(register({ event: 'roomArchived', triggerWords: ['deploy'] }), {
			event: 'roomArchived',
			message: makeMessage({ msg: 'nothing to see' }),
		});

		expect(serverFetch).toHaveBeenCalledTimes(1);
	});

	it('skips edited messages unless the integration runs on edits', async () => {
		const edited = makeMessage({ editedAt: new Date('2024-01-03T00:00:00.000Z') });

		await runUrl(register({ _id: 'no-edits', runOnEdits: false }), { message: edited });
		await runUrl(register({ _id: 'edits', runOnEdits: true }), { message: edited });

		expect(serverFetch).toHaveBeenCalledTimes(1);
		expect(historyCall('start-execute-trigger-url')).toMatchObject({ integration: expect.objectContaining({ _id: 'edits' }) });
	});

	it('stops when the preparation script returns no request options', async () => {
		engine.prepareOutgoingRequest.mockResolvedValue(undefined as any);

		await runUrl(register());

		expect(historyCall('after-prepare-no-opts')).toMatchObject({ finished: true });
		expect(serverFetch).not.toHaveBeenCalled();
	});

	it('sends a message returned by the preparation script before calling the webhook', async () => {
		engine.prepareOutgoingRequest.mockResolvedValue({
			url: 'https://hooks.example/one',
			method: 'POST',
			headers: {},
			message: { text: 'prepared' },
		});

		await runUrl(register());

		expect(historyCall('after-prepare-send-message')).toMatchObject({
			prepareSentMessage: [{ channel: '#room-1', message: { _id: 'sent-1' } }],
		});
		expect(serverFetch).toHaveBeenCalledTimes(1);
	});

	it('stops when the message returned by the preparation script cannot be delivered', async () => {
		jest.mocked(processWebhookMessage).mockResolvedValue(undefined as any);
		engine.prepareOutgoingRequest.mockResolvedValue({
			url: 'https://hooks.example/one',
			method: 'POST',
			headers: {},
			message: { text: 'prepared' },
		});

		await runUrl(register());

		expect(historyCall('after-prepare-send-message-failed')).toMatchObject({ finished: true });
		expect(serverFetch).not.toHaveBeenCalled();
	});

	it('stops when the prepared request has no url or no method', async () => {
		const integration = register();
		engine.prepareOutgoingRequest.mockResolvedValueOnce({ method: 'POST', headers: {} });
		engine.prepareOutgoingRequest.mockResolvedValueOnce({ url: 'https://hooks.example/one', headers: {} });

		await runUrl(integration);
		await runUrl(integration);

		expect(historySteps().filter((step) => step === 'after-prepare-no-url_or_method')).toHaveLength(2);
		expect(serverFetch).not.toHaveBeenCalled();
	});

	it('wraps script engine errors in Meteor errors and rethrows anything else untouched', async () => {
		const integration = register();
		engine.prepareOutgoingRequest.mockRejectedValueOnce(new Error('the script blew up'));
		engine.prepareOutgoingRequest.mockRejectedValueOnce('just a string');

		const error = await runUrl(integration).catch((e) => e);
		expect(error).toBeInstanceOf(Meteor.Error);
		expect(error.message).toBe('the script blew up');
		await expect(runUrl(integration)).rejects.toBe('just a string');
		expect(serverFetch).not.toHaveBeenCalled();
	});

	it('rejects a malformed auth option and turns a valid one into a basic authorization header', async () => {
		const integration = register();
		engine.prepareOutgoingRequest.mockResolvedValueOnce({ url: 'https://hooks.example/one', method: 'POST', headers: {}, auth: 'nocolon' });
		engine.prepareOutgoingRequest.mockResolvedValueOnce({
			url: 'https://hooks.example/one',
			method: 'POST',
			headers: {},
			auth: 'user:pass',
		});

		await expect(runUrl(integration)).rejects.toThrow('auth option should be of the form "username:password"');
		expect(serverFetch).not.toHaveBeenCalled();

		await runUrl(integration);
		expect(fetchOptions().headers).toMatchObject({ Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}` });
	});

	it('sends data as a json body with the fixed request options', async () => {
		jest.mocked(settings.get).mockImplementation((key: string) => key === 'Allow_Invalid_SelfSigned_Certs');

		await runUrl(register());

		const [url, options, allowInvalidCerts] = jest.mocked(serverFetch).mock.calls[0] as unknown as [string, Record<string, any>, boolean];
		expect(url).toBe('https://hooks.example/one');
		expect(options).toMatchObject({ method: 'POST', ignoreSsrfValidation: true, size: 10 * 1024 * 1024 });
		expect(options.headers['Content-Type']).toBe('application/json');
		expect(options.body).toMatchObject({ token: 'integration-token', text: 'hello world', channel_id: 'room-1' });
		expect(allowInvalidCerts).toBe(true);
		expect(historyCall('pre-http-call')).toMatchObject({ httpCallData: options.body });
	});

	it('omits the json header and body without data, and forwards a configured timeout', async () => {
		engine.prepareOutgoingRequest.mockResolvedValue({
			url: 'https://hooks.example/one',
			method: 'POST',
			headers: {},
			timeout: 4000,
		} as any);

		await runUrl(register());

		expect(fetchOptions().headers['Content-Type']).toBeUndefined();
		expect(fetchOptions().body).toBeUndefined();
		expect(fetchOptions().timeout).toBe(4000);
	});
});

describe('response processing', () => {
	it('parses json and javascript bodies only', async () => {
		const integration = register();
		const parseable = [
			'application/json',
			'text/javascript',
			'application/javascript',
			'application/x-javascript',
			'application/json; charset=utf-8',
		];

		for (const contentType of [...parseable, 'text/html', null]) {
			jest.mocked(serverFetch).mockResolvedValueOnce(
				// A Buffer body is the only way to get a response with no content-type header at all.
				contentType
					? new Response('{"text":"parsed"}', { headers: { 'Content-Type': contentType } })
					: new Response(Buffer.from('{"text":"parsed"}')),
			);
			await runUrl(integration);
		}

		expect(jest.mocked(processWebhookMessage).mock.calls.map(([message]) => message.text)).toEqual(parseable.map(() => 'parsed'));
	});

	it('tolerates an unparseable json body', async () => {
		jest.mocked(serverFetch).mockResolvedValue(new Response('not json at all', { headers: { 'Content-Type': 'application/json' } }));

		await runUrl(register());

		expect(historyCall('after-http-call')).toMatchObject({ httpResult: 'not json at all' });
		expect(processWebhookMessage).not.toHaveBeenCalled();
	});

	it('records an empty body as a failed call', async () => {
		jest.mocked(serverFetch).mockResolvedValue(new Response(''));

		await runUrl(register());

		expect(historyCall('after-http-call')).toMatchObject({ httpError: null, httpResult: '' });
		expect(historyCall('failed-and-not-configured-to-retry')).toMatchObject({ error: true });
	});

	it('sends a message returned by the response script', async () => {
		engine.processOutgoingResponse.mockResolvedValue({ text: 'from the script' } as any);

		await runUrl(register());

		expect(historyCall('after-process-send-message')).toMatchObject({
			processSentMessage: [{ channel: '#room-1', message: { _id: 'sent-1' } }],
			finished: true,
		});
		expect(historyCall('url-response-sent-message')).toBeUndefined();
	});

	it('stops when a message returned by the response script cannot be delivered', async () => {
		engine.processOutgoingResponse.mockResolvedValue({ text: 'from the script' } as any);
		jest.mocked(processWebhookMessage).mockResolvedValue(undefined as any);

		await runUrl(register());

		expect(historyCall('after-process-send-message-failed')).toMatchObject({ finished: true });
	});

	it('stops when the response script explicitly returns false', async () => {
		engine.processOutgoingResponse.mockResolvedValue(false);

		await runUrl(register());

		expect(historyCall('after-process-false-result')).toMatchObject({ finished: true });
		expect(processWebhookMessage).not.toHaveBeenCalled();
	});

	it('posts a successful response carrying text or attachments', async () => {
		const integration = register();
		jest
			.mocked(serverFetch)
			.mockResolvedValueOnce(new Response('{"text":"all good"}', { status: 201, headers: { 'Content-Type': 'application/json' } }));
		jest
			.mocked(serverFetch)
			.mockResolvedValueOnce(
				new Response('{"attachments":[{"title":"report"}]}', { status: 202, headers: { 'Content-Type': 'application/json' } }),
			);

		await runUrl(integration);
		await runUrl(integration);

		expect(jest.mocked(processWebhookMessage).mock.calls.map(([message]) => message)).toEqual([
			expect.objectContaining({ text: 'all good' }),
			expect.objectContaining({ attachments: [{ title: 'report' }] }),
		]);
		expect(historyCall('url-response-sent-message')).toMatchObject({
			resultMessage: [{ channel: '#room-1', message: { _id: 'sent-1' } }],
			finished: true,
		});
	});

	it('posts nothing for a successful response with neither text nor attachments', async () => {
		jest.mocked(serverFetch).mockResolvedValue(new Response('{"other":"value"}', { headers: { 'Content-Type': 'application/json' } }));

		await runUrl(register());

		expect(processWebhookMessage).not.toHaveBeenCalled();
		expect(historyCall('url-response-sent-message')).toBeUndefined();
	});

	it('records a failure when the successful response message cannot be delivered', async () => {
		jest.mocked(processWebhookMessage).mockResolvedValue(undefined as any);

		await runUrl(register());

		expect(historyCall('after-http-call-send-message-failed')).toMatchObject({ finished: true });
	});

	it('disables the integration on a 410 response', async () => {
		jest.mocked(serverFetch).mockResolvedValue(new Response('gone forever', { status: 410 }));

		await runUrl(register({ _id: 'gone-1' }));

		expect(Integrations.updateOne).toHaveBeenCalledWith({ _id: 'gone-1' }, { $set: { enabled: false } });
		expect(notifyOnIntegrationChangedById).toHaveBeenCalledWith('gone-1');
		expect(historyCall('after-process-http-status-410')).toMatchObject({ error: true });
	});

	it('records a 500 response without disabling the integration', async () => {
		jest.mocked(serverFetch).mockResolvedValue(new Response('kaboom', { status: 500 }));

		await runUrl(register());

		expect(historyCall('after-process-http-status-500')).toMatchObject({ error: true });
		expect(Integrations.updateOne).not.toHaveBeenCalled();
	});

	it('records a failure that is not configured to retry', async () => {
		jest.mocked(serverFetch).mockResolvedValue(new Response('bad request', { status: 400 }));

		await runUrl(register({ retryFailedCalls: false }));

		expect(historyCall('failed-and-not-configured-to-retry')).toMatchObject({ error: true });
	});

	it('records a rejected request', async () => {
		const err = new Error('connection refused');
		jest.mocked(serverFetch).mockRejectedValue(err);

		await runUrl(register());

		expect(historyCall('after-http-call')).toMatchObject({ httpError: err, httpResult: null });
		expect(processWebhookMessage).not.toHaveBeenCalled();
	});
});

describe('retries', () => {
	beforeEach(() => {
		jest.mocked(serverFetch).mockImplementation(async () => new Response('bad request', { status: 400 }));
	});

	it.each([
		['powers-of-ten', 100, 1000],
		['powers-of-two', 2000, 4000],
		['increments-of-two', 2000, 4000],
	] as const)('retries with %s delays of %sms and then %sms', async (retryDelay, firstWait, secondWait) => {
		await runUrl(register({ retryFailedCalls: true, retryCount: 3, retryDelay }));
		expect(historyCall('going-to-retry-1')).toMatchObject({ error: true });

		for (const [wait, expectedCalls] of [
			[firstWait, 2],
			[secondWait, 3],
		]) {
			jest.advanceTimersByTime(wait - 1);
			await settle();
			expect(serverFetch).toHaveBeenCalledTimes(expectedCalls - 1);

			jest.advanceTimersByTime(1);
			await settle();
			expect(serverFetch).toHaveBeenCalledTimes(expectedCalls);
		}
	});

	it('records an invalid retry delay without retrying', async () => {
		await runUrl(register({ retryFailedCalls: true, retryCount: 3, retryDelay: 'every-other-tuesday' as any }));

		expect(historyCall('failed-and-retry-delay-is-invalid')).toMatchObject({ error: true, errorStack: expect.any(String) });
		jest.advanceTimersByTime(60_000);
		await settle();
		expect(serverFetch).toHaveBeenCalledTimes(1);
	});

	it('does not retry once retries are exhausted or when they are not fully configured', async () => {
		await runUrl(register({ _id: 'exhausted', retryFailedCalls: true, retryCount: 2, retryDelay: 'powers-of-two' }), {}, 2);
		await runUrl(register({ _id: 'no-delay', retryFailedCalls: true, retryCount: 3, retryDelay: undefined }));
		await runUrl(register({ _id: 'no-count', retryFailedCalls: true, retryCount: 0, retryDelay: 'powers-of-two' }));

		expect(historySteps().filter((step) => step === 'too-many-retries' || step === 'failed-and-not-configured-to-retry')).toEqual([
			'too-many-retries',
			'too-many-retries',
			'failed-and-not-configured-to-retry',
		]);
		jest.advanceTimersByTime(60_000);
		await settle();
		expect(serverFetch).toHaveBeenCalledTimes(3);
	});
});

describe('replay', () => {
	it('refuses to replay a non-outgoing integration or a history record without data', async () => {
		await expect(triggerHandler.replay(makeIntegration({ type: 'webhook-incoming' as any }), makeHistory())).rejects.toThrow(
			'integration-type-must-be-outgoing',
		);
		await expect(triggerHandler.replay(makeIntegration(), makeHistory({ data: undefined }))).rejects.toThrow(
			'history-data-must-be-defined',
		);
		expect(serverFetch).not.toHaveBeenCalled();
	});

	it('does nothing when the history record has no url', async () => {
		const integration = register();

		await expect(triggerHandler.replay(integration, makeHistory({ url: undefined }))).resolves.toBeUndefined();
		await settle();

		expect(serverFetch).not.toHaveBeenCalled();
		expect(updateHistory).not.toHaveBeenCalled();
	});

	it('resolves the referenced records and replays against the stored url and event', async () => {
		const integration = register();
		jest.mocked(Users.findOneById).mockImplementation(async (id: string) => makeUser({ _id: id }));
		jest.mocked(Messages.findOneById).mockResolvedValue(makeMessage({ msg: 'replayed message' }));
		jest.mocked(Rooms.findOneById).mockResolvedValue(makeRoom());

		await triggerHandler.replay(integration, makeHistory());
		await settle();

		expect(jest.mocked(Users.findOneById).mock.calls).toEqual([['owner-9'], ['user-1']]);
		expect(Messages.findOneById).toHaveBeenCalledWith('message-1');
		expect(Rooms.findOneById).toHaveBeenCalledWith('room-1');
		expect(historyCall('start-execute-trigger-url')).toMatchObject({ event: 'sendMessage', integration });
		expect(fetchedUrls()).toEqual(['https://hooks.example/replayed']);
		expect(fetchOptions().body).toMatchObject({ channel_id: 'room-1', channel_name: 'general', text: 'replayed message' });
	});
});

describe('payloads for message-less events (current behavior)', () => {
	it('sends an empty payload for every event dispatched without a message', async () => {
		const events: [string, ...unknown[]][] = [
			['roomCreated', makeUser({ _id: 'owner-9' }), makeRoom({ t: 'p' })],
			['roomArchived', makeRoom({ t: 'p' }), makeUser()],
			// roomJoined/roomLeft do use channels, so they land in the public-channel bucket.
			['roomJoined', makeUser(), makeRoom({ t: 'c' })],
			['roomLeft', { user: makeUser() }, makeRoom({ t: 'c' })],
			['userCreated', makeUser()],
		];

		for (const [event] of events) {
			triggerHandler.addIntegration(makeIntegration({ _id: event, event: event as IOutgoingIntegration['event'] }));
		}
		for (const args of events) {
			await triggerHandler.executeTriggers(...args);
		}
		await settle();

		expect(jest.mocked(serverFetch).mock.calls.map(([, options]) => (options as Record<string, any>).body)).toEqual(
			events.map(() => ({ token: 'integration-token', bot: false })),
		);
	});
});
