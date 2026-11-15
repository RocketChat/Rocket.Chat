import express from 'express';
import { WebApp } from 'meteor/webapp';
import request from 'supertest';

const mockIntegrations = {
	findOneByIdAndToken: jest.fn(),
	findOneByUrl: jest.fn(),
};

const mockUsers = {
	findOneById: jest.fn(),
};

const mockHasPermissionAsync = jest.fn();
const mockProcessWebhookMessage = jest.fn();
const mockAddOutgoingIntegration = jest.fn();
const mockDeleteOutgoingIntegration = jest.fn();

const mockSettingsStore = new Map<string, unknown>([
	['API_Enable_Rate_Limiter_Limit_Calls_Default', 1],
	['API_Enable_Rate_Limiter_Limit_Time_Default', 60000],
	['API_Enable_Rate_Limiter', false],
]);

const rateLimiterCounters = new Map<string, number>();

class MockRateLimiter {
	private numRequestsAllowed = Number.POSITIVE_INFINITY;

	private intervalTimeInMS = 0;

	private counters = rateLimiterCounters;

	addRule(_rule: unknown, numRequestsAllowed: number, intervalTimeInMS: number) {
		this.numRequestsAllowed = numRequestsAllowed;
		this.intervalTimeInMS = intervalTimeInMS;
	}

	increment(match: Record<string, unknown>) {
		const key = JSON.stringify(match);
		this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
	}

	async check(match: Record<string, unknown>) {
		const used = this.counters.get(JSON.stringify(match)) ?? 0;
		return {
			allowed: used <= this.numRequestsAllowed,
			numInvocationsLeft: Math.max(0, this.numRequestsAllowed - used),
			timeToReset: this.intervalTimeInMS,
		};
	}
}

jest.mock(
	'meteor/meteor',
	() => ({
		Meteor: {
			startup: (callback: () => void) => callback(),
			Error: class MeteorError extends Error {
				public details?: unknown;

				constructor(
					public error: string,
					public reason?: string,
					details?: unknown,
				) {
					super(reason ?? error);
					this.details = details;
				}
			},
		},
	}),
	{ virtual: true },
);
jest.mock('meteor/webapp', () => ({ WebApp: { rawConnectHandlers: { use: jest.fn() } } }), { virtual: true });
jest.mock('meteor/rate-limit', () => ({ RateLimiter: MockRateLimiter }), { virtual: true });
jest.mock(
	'meteor/accounts-base',
	() => ({ Accounts: { _hashLoginToken: (token: string) => `hashed-${token}`, _accountData: {} as Record<string, unknown> } }),
	{ virtual: true },
);
jest.mock('meteor/ddp', () => ({ DDP: {} }), { virtual: true });
jest.mock('meteor/ddp-common', () => ({ DDPCommon: {} }), { virtual: true });

jest.mock('../../app/utils/rocketchat.info', () => ({ Info: { version: '0.0.0' } }));

jest.mock('../settings', () => ({
	settings: {
		get: (id: string) => mockSettingsStore.get(id),
		watch: jest.fn(),
		watchMultiple: jest.fn(),
		watchByRegex: jest.fn(),
		getByRegexp: jest.fn(() => []),
	},
}));

jest.mock('meteor/facts-base', () => ({ Facts: { incrementServerFact: () => undefined } }), { virtual: true });

jest.mock('@rocket.chat/models', () => ({
	Integrations: mockIntegrations,
	Users: mockUsers,
}));

jest.mock('meteor/email', () => ({ Email: {} }), { virtual: true });
jest.mock('../lib/authorization/hasPermission', () => ({ hasPermissionAsync: mockHasPermissionAsync }));
jest.mock('../lib/messages/processWebhookMessage', () => ({ processWebhookMessage: mockProcessWebhookMessage }));
jest.mock('../meteor-methods/integrations/outgoing/addOutgoingIntegration', () => ({
	addOutgoingIntegration: mockAddOutgoingIntegration,
}));
jest.mock('../meteor-methods/integrations/outgoing/deleteOutgoingIntegration', () => ({
	deleteOutgoingIntegration: mockDeleteOutgoingIntegration,
}));

const INTEGRATION = {
	_id: 'integration-id',
	name: 'my-integration',
	enabled: true,
	userId: 'assigned-user-id',
	channel: ['#general'],
	alias: 'alias',
	avatar: 'avatar-url',
	emoji: ':ghost:',
	scriptEnabled: false,
	overrideDestinationChannelEnabled: false,
	_updatedAt: new Date(0),
};

const ASSIGNED_USER = { _id: 'assigned-user-id', username: 'rocket.cat', name: 'Rocket Cat' };

const HOOK_URL = '/hooks/integration-id/the-token';
const LEGACY_HOOK_URL = '/hooks/integration-id/legacy-user-id/the-token';

jest.requireActual('./api');
jest.requireActual('./webhooks');

const app = express().use(jest.mocked(WebApp.rawConnectHandlers.use).mock.calls[0][0] as unknown as express.RequestHandler);

describe('Webhooks API', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		rateLimiterCounters.clear();
		mockSettingsStore.set('API_Enable_Rate_Limiter', false);
		process.env.NODE_ENV = 'test';

		mockIntegrations.findOneByIdAndToken.mockResolvedValue({ ...INTEGRATION });
		mockUsers.findOneById.mockResolvedValue({ ...ASSIGNED_USER });
		mockHasPermissionAsync.mockResolvedValue(true);
		mockProcessWebhookMessage.mockResolvedValue([{ _id: 'message-id' }]);
	});

	describe('authentication and routing', () => {
		it('accepts a POST for a valid integration id and token', async () => {
			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ success: true });
			expect(mockIntegrations.findOneByIdAndToken).toHaveBeenCalledWith('integration-id', 'the-token');
		});

		it('accepts a GET for a valid integration id and token', async () => {
			const response = await request(app).get(`${HOOK_URL}?text=hello`);

			expect(response.statusCode).toBe(200);
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('accepts the legacy route carrying a userId segment', async () => {
			const response = await request(app).post(LEGACY_HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(200);
			expect(mockIntegrations.findOneByIdAndToken).toHaveBeenCalledWith('integration-id', 'the-token');
			expect(mockProcessWebhookMessage).toHaveBeenCalledTimes(1);
		});

		it('url-decodes the token before looking the integration up', async () => {
			await request(app).post('/hooks/integration-id/token%2520with%2520spaces').send({ text: 'hello' });

			expect(mockIntegrations.findOneByIdAndToken).toHaveBeenCalledWith('integration-id', 'token with spaces');
		});

		// 500 is the current behavior and it is wrong: authenticatedRoute throws instead of returning null, so this never reaches the 401 path.
		it('rejects an unknown integration id or token without processing anything', async () => {
			mockIntegrations.findOneByIdAndToken.mockResolvedValue(null);

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(500);
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('rejects the request when the integration has no assigned user', async () => {
			mockUsers.findOneById.mockResolvedValue(null);

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(401);
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('impersonates the user assigned to the integration', async () => {
			mockUsers.findOneById.mockResolvedValue({ _id: 'other-user', username: 'other', name: 'Other' });

			await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(mockUsers.findOneById).toHaveBeenCalledWith('assigned-user-id');
			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ _id: 'other-user' }),
				expect.anything(),
			);
		});
	});

	describe('request body handling', () => {
		it('forwards a plain JSON body untouched', async () => {
			await request(app)
				.post(HOOK_URL)
				.send({ text: 'hello', attachments: [{ title: 't' }] });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ text: 'hello', attachments: [{ title: 't' }] }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('unwraps a url-encoded `payload` field holding JSON', async () => {
			await request(app)
				.post(HOOK_URL)
				.type('form')
				.send({ payload: JSON.stringify({ text: 'from payload' }) });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ text: 'from payload' }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('keeps the original body when the url-encoded `payload` is not valid JSON', async () => {
			await request(app).post(HOOK_URL).type('form').send({ payload: '{not json' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ payload: '{not json' }),
				expect.anything(),
				expect.anything(),
			);
		});

		it.each([
			['an array', JSON.stringify([{ text: 'hello' }])],
			['a primitive', '42'],
		])('rejects a url-encoded `payload` holding %s', async (_label, payload) => {
			const response = await request(app).post(HOOK_URL).type('form').send({ payload });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('Integration payload must be a JSON object, not an array or primitive');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('does not unwrap `payload` when the url-encoded body carries other fields', async () => {
			await request(app)
				.post(HOOK_URL)
				.type('form')
				.send({ payload: JSON.stringify({ text: 'from payload' }), token: 'abc' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ payload: JSON.stringify({ text: 'from payload' }), token: 'abc' }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('does not unwrap `payload` when the content type is JSON', async () => {
			await request(app)
				.post(HOOK_URL)
				.send({ payload: JSON.stringify({ text: 'from payload' }) });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ payload: JSON.stringify({ text: 'from payload' }) }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('accepts an empty body without producing a message', async () => {
			const response = await request(app).post(HOOK_URL);

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ success: true });
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('discards a JSON body that is not an object', async () => {
			const response = await request(app)
				.post(HOOK_URL)
				.send([{ text: 'hello' }]);

			expect(response.statusCode).toBe(200);
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('still processes an empty body when the integration has scripting enabled', async () => {
			mockIntegrations.findOneByIdAndToken.mockResolvedValue({ ...INTEGRATION, scriptEnabled: true });

			const response = await request(app).post(HOOK_URL);

			expect(response.statusCode).toBe(200);
			expect(mockProcessWebhookMessage).toHaveBeenCalledTimes(1);
		});
	});

	describe('integration execution', () => {
		it('reports the service as unavailable when the integration is disabled', async () => {
			mockIntegrations.findOneByIdAndToken.mockResolvedValue({ ...INTEGRATION, enabled: false });

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(503);
			expect(response.body).toEqual({ success: false, error: 'Service Unavailable' });
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('refuses to post when the assigned user lacks message-impersonate', async () => {
			mockHasPermissionAsync.mockResolvedValue(false);

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('error-user-lacks-message-impersonate-permission');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('sends the integration defaults and bot marker along with the message', async () => {
			await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ text: 'hello', bot: { i: 'integration-id' } }),
				expect.objectContaining({ _id: 'assigned-user-id' }),
				{ channel: ['#general'], alias: 'alias', avatar: 'avatar-url', emoji: ':ghost:' },
			);
		});

		it('falls back to empty defaults when the integration sets no alias, avatar or emoji', async () => {
			mockIntegrations.findOneByIdAndToken.mockResolvedValue({
				...INTEGRATION,
				alias: undefined,
				avatar: undefined,
				emoji: undefined,
			});

			await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
				channel: ['#general'],
				alias: '',
				avatar: '',
				emoji: '',
			});
		});

		it('refuses a `channel` override when overriding is disabled', async () => {
			const response = await request(app).post(HOOK_URL).send({ text: 'hello', channel: '#other' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('overriding destination channel is disabled for this integration');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('refuses a `roomId` override when overriding is disabled', async () => {
			const response = await request(app).post(HOOK_URL).send({ text: 'hello', roomId: 'room-id' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('overriding destination channel is disabled for this integration');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('forwards a `channel` override when the integration allows it', async () => {
			mockIntegrations.findOneByIdAndToken.mockResolvedValue({ ...INTEGRATION, overrideDestinationChannelEnabled: true });

			const response = await request(app).post(HOOK_URL).send({ text: 'hello', channel: '#other' });

			expect(response.statusCode).toBe(200);
			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ channel: '#other' }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('fails when message processing produces no message', async () => {
			mockProcessWebhookMessage.mockResolvedValue([]);

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('unknown-error');
		});

		it('surfaces the error code when message processing rejects with one', async () => {
			mockProcessWebhookMessage.mockRejectedValue(Object.assign(new Error('boom'), { error: 'error-invalid-room' }));

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('error-invalid-room');
		});

		it('surfaces the message when message processing rejects without an error code', async () => {
			mockProcessWebhookMessage.mockRejectedValue(new Error('something exploded'));

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('something exploded');
		});

		it('reports an unknown error when message processing rejects with no detail', async () => {
			mockProcessWebhookMessage.mockRejectedValue({});

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('Unknown error');
		});
	});

	// The real engine caches compiled scripts per integration id and _updatedAt; reusing a pair silently runs the previous script.
	describe('integration scripts', () => {
		let scriptSeq = 0;

		const withScript = (body: string, overrides: Record<string, unknown> = {}): void => {
			scriptSeq += 1;
			mockIntegrations.findOneByIdAndToken.mockResolvedValue({
				...INTEGRATION,
				_id: `integration-${scriptSeq}`,
				_updatedAt: new Date(scriptSeq * 1000),
				scriptEnabled: true,
				script: '',
				scriptCompiled: `class Script { process_incoming_request({ request }) { ${body} } }`,
				...overrides,
			});
		};

		it('posts the payload the script produced instead of the original one', async () => {
			withScript("return { content: { text: 'rewritten by script' } };");

			const response = await request(app).post(HOOK_URL).send({ text: 'original' });

			expect(response.statusCode).toBe(200);
			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ text: 'rewritten by script' }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('hands the script the request payload, raw content and context', async () => {
			withScript(
				'return { content: { text: "x", seen: { content: request.content, content_raw: request.content_raw, url_params: request.url_params, pathname: request.url.pathname, query: request.url.query, host: request.headers.host, user: request.user } } };',
			);

			await request(app).post(`${HOOK_URL}?a=1`).set('host', 'example.com').send({ text: 'hello' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					seen: {
						content: { text: 'hello' },
						content_raw: JSON.stringify({ text: 'hello' }),
						url_params: { integrationId: 'integration-id', token: 'the-token' },
						pathname: HOOK_URL,
						query: { a: '1' },
						host: 'example.com',
						user: { _id: 'assigned-user-id', name: 'Rocket Cat', username: 'rocket.cat' },
					},
				}),
				expect.anything(),
				expect.anything(),
			);
		});

		it('leaves the payload alone when the integration has no compiled script', async () => {
			withScript('return { content: { text: "rewritten by script" } };', { scriptCompiled: undefined });

			await request(app).post(HOOK_URL).send({ text: 'original' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.objectContaining({ text: 'original' }),
				expect.anything(),
				expect.anything(),
			);
		});

		it('leaves the payload alone for a GET request, which carries no body', async () => {
			withScript('return { content: { text: "rewritten by script" } };');

			const response = await request(app).get(`${HOOK_URL}?text=hello`);

			expect(response.statusCode).toBe(200);
			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				{ bot: { i: `integration-${scriptSeq}` } },
				expect.anything(),
				expect.anything(),
			);
		});

		it('accepts the request without posting when the script returns nothing', async () => {
			withScript('return undefined;');

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ success: true });
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('propagates an error reported by the script', async () => {
			withScript("return { error: 'script-said-no' };");

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('script-said-no');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('fails when the script returns no usable payload', async () => {
			withScript('return { content: undefined };');

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('error-running-script');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('fails when running the script throws', async () => {
			withScript("throw new Error('boom');");

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('error-running-script');
			expect(mockProcessWebhookMessage).not.toHaveBeenCalled();
		});

		it('keeps the requested separateResponse when the script does not set one', async () => {
			withScript("return { content: { text: 'from script' } };");

			const response = await request(app).post(HOOK_URL).send({ text: 'original', separateResponse: true });

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ responses: [{ _id: 'message-id' }], success: true });
		});

		it('lets the script turn separateResponse off', async () => {
			withScript("return { content: { text: 'from script', separateResponse: false } };");

			const response = await request(app).post(HOOK_URL).send({ text: 'original', separateResponse: true });

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ success: true });
		});

		it('posts as the user the script returned', async () => {
			withScript("return { content: { text: 'hello' }, user: { _id: 'script-user', username: 'script.user' } };");

			await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(mockProcessWebhookMessage).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ _id: 'script-user' }),
				expect.anything(),
			);
		});

		it('returns the custom response the script produced', async () => {
			withScript("return { content: { text: 'hello' }, response: { custom: 'body' } };");

			const response = await request(app).post(HOOK_URL).send({ text: 'hello' });

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ custom: 'body', success: true });
		});
	});

	describe('separate responses', () => {
		it('returns every delivery when at least one succeeded', async () => {
			mockProcessWebhookMessage.mockResolvedValue([{ _id: 'ok' }, { error: 'error-invalid-room' }]);

			const response = await request(app).post(HOOK_URL).send({ text: 'hello', separateResponse: true });

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ responses: [{ _id: 'ok' }, { error: 'error-invalid-room' }], success: true });
		});

		it('fails when every delivery failed', async () => {
			mockProcessWebhookMessage.mockResolvedValue([{ error: 'error-invalid-room' }, { error: 'error-not-allowed' }]);

			const response = await request(app).post(HOOK_URL).send({ text: 'hello', separateResponse: true });

			expect(response.statusCode).toBe(400);
			expect(response.body).toEqual({
				responses: [{ error: 'error-invalid-room' }, { error: 'error-not-allowed' }],
				success: false,
			});
		});
	});

	// Only the legacy userId routes are reachable: :integrationId/:userId/:token is registered first and swallows the two-segment variants.
	describe('sample and info endpoints', () => {
		it('returns sample messages', async () => {
			const response = await request(app).get('/hooks/sample/integration-id/legacy-user-id/the-token');

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(3);
			expect(response.body[0]).toEqual(
				expect.objectContaining({ channel_name: 'general', user_name: 'rocket.cat', text: 'Sample text 1', trigger_word: 'Sample' }),
			);
		});

		it('reports integration info', async () => {
			const response = await request(app).get('/hooks/info/integration-id/legacy-user-id/the-token');

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('creating outgoing integrations', () => {
		beforeEach(() => {
			mockAddOutgoingIntegration.mockResolvedValue({ _id: 'created-id' });
		});

		it('creates a channel integration, prefixing the channel name with #', async () => {
			const response = await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({
					event: 'newMessageOnChannel',
					name: 'my hook',
					target_url: 'https://example.com/hook',
					data: { channel_name: 'general' },
				});

			expect(response.statusCode).toBe(200);
			expect(mockAddOutgoingIntegration).toHaveBeenCalledWith(
				'assigned-user-id',
				expect.objectContaining({ channel: '#general', name: 'my hook', urls: ['https://example.com/hook'], enabled: true }),
			);
		});

		it('keeps a channel name that already starts with #', async () => {
			await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({
					event: 'newMessageOnChannel',
					name: 'my hook',
					target_url: 'https://example.com/hook',
					data: { channel_name: '#general' },
				});

			expect(mockAddOutgoingIntegration).toHaveBeenCalledWith('assigned-user-id', expect.objectContaining({ channel: '#general' }));
		});

		it('creates a channel integration with no channel when none was given', async () => {
			await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({ event: 'newMessageOnChannel', name: 'my hook', target_url: 'https://example.com/hook' });

			expect(mockAddOutgoingIntegration).toHaveBeenCalledWith('assigned-user-id', expect.objectContaining({ channel: undefined }));
		});

		it('creates a user integration, prefixing the username with @', async () => {
			await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({
					event: 'newMessageToUser',
					name: 'my hook',
					target_url: 'https://example.com/hook',
					data: { username: 'rocket.cat' },
				});

			expect(mockAddOutgoingIntegration).toHaveBeenCalledWith('assigned-user-id', expect.objectContaining({ channel: '@rocket.cat' }));
		});

		it('keeps a username that already starts with @', async () => {
			await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({
					event: 'newMessageToUser',
					name: 'my hook',
					target_url: 'https://example.com/hook',
					data: { username: '@rocket.cat' },
				});

			expect(mockAddOutgoingIntegration).toHaveBeenCalledWith('assigned-user-id', expect.objectContaining({ channel: '@rocket.cat' }));
		});

		it('refuses a user integration with no username', async () => {
			const response = await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({ event: 'newMessageToUser', name: 'my hook', target_url: 'https://example.com/hook' });

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toBe('username-required');
			expect(mockAddOutgoingIntegration).not.toHaveBeenCalled();
		});

		it('refuses an unsupported event', async () => {
			const response = await request(app)
				.post('/hooks/add/integration-id/legacy-user-id/the-token')
				.send({ event: 'somethingElse', name: 'my hook', target_url: 'https://example.com/hook' });

			expect(response.statusCode).toBe(400);
			expect(mockAddOutgoingIntegration).not.toHaveBeenCalled();
		});
	});

	describe('removing outgoing integrations', () => {
		it('removes the integration registered for the given url', async () => {
			mockIntegrations.findOneByUrl.mockResolvedValue({ _id: 'outgoing-id' });

			const response = await request(app)
				.post('/hooks/remove/integration-id/legacy-user-id/the-token')
				.send({ target_url: 'https://example.com/hook' });

			expect(response.statusCode).toBe(200);
			expect(mockIntegrations.findOneByUrl).toHaveBeenCalledWith('https://example.com/hook');
			expect(mockDeleteOutgoingIntegration).toHaveBeenCalledWith('outgoing-id', 'assigned-user-id');
		});

		it('reports integration-not-found and deletes nothing when no integration matches the url', async () => {
			mockIntegrations.findOneByUrl.mockResolvedValue(null);

			const response = await request(app)
				.post('/hooks/remove/integration-id/legacy-user-id/the-token')
				.send({ target_url: 'https://example.com/missing' });

			expect(JSON.stringify(response.body)).toContain('integration-not-found');
			expect(mockDeleteOutgoingIntegration).not.toHaveBeenCalled();
		});
	});

	describe('rate limiting', () => {
		const enableRateLimiter = (overrides: Record<string, unknown> = {}): void => {
			mockSettingsStore.set('API_Enable_Rate_Limiter', true);
			Object.entries(overrides).forEach(([key, value]) => mockSettingsStore.set(key, value));
		};

		const post = (url: string, text: string) => request(app).post(url).send({ text });

		it('rejects requests over the limit', async () => {
			enableRateLimiter();

			const first = await post(HOOK_URL, 'a');
			const second = await post(HOOK_URL, 'b');

			expect(first.statusCode).toBe(200);
			expect(second.statusCode).toBe(429);
			expect(second.body.error).toMatch(/too many requests/i);
		});

		it('does not limit requests while the rate limiter is disabled', async () => {
			const first = await post(HOOK_URL, 'a');
			const second = await post(HOOK_URL, 'b');
			const third = await post(HOOK_URL, 'c');

			expect(first.statusCode).toBe(200);
			expect(second.statusCode).toBe(200);
			expect(third.statusCode).toBe(200);
		});

		it('does not limit requests in development unless the dev rate limiter is enabled', async () => {
			process.env.NODE_ENV = 'development';
			enableRateLimiter({ API_Enable_Rate_Limiter_Dev: false });

			const first = await post(HOOK_URL, 'a');
			const second = await post(HOOK_URL, 'b');

			expect(first.statusCode).toBe(200);
			expect(second.statusCode).toBe(200);
		});

		it('limits requests in development when the dev rate limiter is enabled', async () => {
			process.env.NODE_ENV = 'development';
			enableRateLimiter({ API_Enable_Rate_Limiter_Dev: true });

			const first = await post(HOOK_URL, 'a');
			const second = await post(HOOK_URL, 'b');

			expect(first.statusCode).toBe(200);
			expect(second.statusCode).toBe(429);
		});

		it('gives each webhook url its own budget', async () => {
			enableRateLimiter();

			const firstOnA = await post('/hooks/integration-a/the-token', 'a');
			const firstOnB = await post('/hooks/integration-b/the-token', 'b');
			const firstOnLegacy = await post(LEGACY_HOOK_URL, 'c');
			const secondOnA = await post('/hooks/integration-a/the-token', 'd');

			expect(firstOnA.statusCode).toBe(200);
			expect(firstOnB.statusCode).toBe(200);
			expect(firstOnLegacy.statusCode).toBe(200);
			expect(secondOnA.statusCode).toBe(429);
		});
	});
});
