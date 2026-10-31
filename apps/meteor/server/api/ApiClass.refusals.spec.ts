import { createNodeServer, createRootApp, mountRouter } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import request from 'supertest';

const mockSettingsStore = new Map<string, unknown>([['API_Enable_Rate_Limiter', false]]);

jest.mock('meteor/meteor', () => ({ Meteor: { startup: (callback: () => void) => callback() } }), { virtual: true });
jest.mock('../lib/http/httpServer', () => ({ httpApp: jest.requireActual('@rocket.chat/http-router').createRootApp() }));
jest.mock('meteor/rate-limit', () => ({ RateLimiter: jest.fn() }), { virtual: true });
jest.mock('meteor/accounts-base', () => ({ Accounts: { _accountData: {} as Record<string, unknown> } }), { virtual: true });
jest.mock('meteor/ddp', () => ({ DDP: {} }), { virtual: true });
jest.mock('meteor/ddp-common', () => ({ DDPCommon: {} }), { virtual: true });
jest.mock('meteor/facts-base', () => ({ Facts: { incrementServerFact: () => undefined } }), { virtual: true });
jest.mock('meteor/email', () => ({ Email: {} }), { virtual: true });

jest.mock('../../rocketchat.info', () => ({ Info: { version: '0.0.0' } }));

jest.mock('../settings', () => ({
	settings: {
		get: (id: string) => mockSettingsStore.get(id),
		watch: jest.fn(),
		watchMultiple: jest.fn(),
		watchByRegex: jest.fn(),
		getByRegexp: jest.fn(() => []),
	},
}));

jest.mock('@rocket.chat/models', () => ({}));

const { ClientSafeError } = jest.requireActual<typeof import('@rocket.chat/core-services')>('@rocket.chat/core-services');
jest.requireActual('./api');
const { APIClass } = jest.requireActual<typeof import('./ApiClass')>('./ApiClass');

const ajv = new Ajv();

const successResponse = ajv.compile({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

// the shape the apps log endpoints declare for their 403: it does not allow `errorType`
const routeForbiddenResponse = ajv.compile({
	type: 'object',
	properties: {
		success: { type: 'boolean' },
		error: { type: 'string' },
	},
	required: ['success', 'error'],
	additionalProperties: false,
});

let thrown: unknown;

const api = new APIClass({ apiPath: 'refusals/', useDefaultAuth: false, enableCors: false, prettyJson: false }).get(
	'throws',
	{
		authRequired: false,
		response: {
			200: successResponse,
			403: routeForbiddenResponse,
		},
	},
	async function action() {
		throw thrown;
	},
);

const rootApp = createRootApp();
mountRouter(rootApp, api.router);
const app = createNodeServer(rootApp);

describe('APIClass refusals', () => {
	beforeEach(() => {
		process.env.NODE_ENV = 'test';
	});

	it.each([
		'unauthorized',
		'error-unauthorized',
		'not-authorized',
		'not_authorized',
		'error-not-authorized',
		'error-not-allowed',
		'not-allowed',
		'no-permission',
		'error-not-authorized-federation',
		'forbidden',
		'error-forbidden',
	])('answers 403 to a thrown %s, even when the route declares its own 403 schema', async (code) => {
		thrown = new Error(code);

		const response = await request(app).get('/refusals/throws');

		expect(response.statusCode).toBe(403);
		expect(response.body).toEqual({ success: false, error: code, errorType: 'error-forbidden' });
	});

	it('answers a refusal thrown as a ClientSafeError with its reason, without the code suffix', async () => {
		thrown = new ClientSafeError('not_authorized', 'Unauthorized', { method: 'test' });

		const response = await request(app).get('/refusals/throws');

		expect(response.statusCode).toBe(403);
		expect(response.body).toEqual({ success: false, error: 'Unauthorized', errorType: 'error-forbidden' });
	});

	it('answers a refusal thrown as a ClientSafeError without a reason with the default message', async () => {
		thrown = new ClientSafeError('not_authorized');

		const response = await request(app).get('/refusals/throws');

		expect(response.statusCode).toBe(403);
		expect(response.body).toEqual({ success: false, error: 'You are not allowed to do this', errorType: 'error-forbidden' });
	});
});
