import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

import { GraphTokenManager } from '../../../../../ee/server/lib/calendarSync/providers/graph/GraphTokenManager';

const CONFIG = {
	tenantId: 'tenant-1',
	clientId: 'client-1',
	clientSecret: 'secret-1',
	loginHost: 'https://login.microsoftonline.com',
	graphHost: 'https://graph.microsoft.com',
};

const tokenResponse = (accessToken: string, expiresIn = 3600) => ({
	ok: true,
	status: 200,
	headers: { get: () => null },
	json: async () => ({ access_token: accessToken, expires_in: expiresIn, token_type: 'Bearer' }),
	text: async () => '',
});

const errorResponse = (status: number, description: string) => ({
	ok: false,
	status,
	headers: { get: () => null },
	json: async () => ({ error: 'invalid_request', error_description: description }),
	text: async () => '',
});

describe('calendarSync/GraphTokenManager', () => {
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		clock = sinon.useFakeTimers(new Date('2026-07-11T12:00:00Z'));
	});

	afterEach(() => {
		clock.restore();
	});

	it('should request a client-credentials token with the .default graph scope', async () => {
		const fetchFn = sinon.stub().resolves(tokenResponse('tok-1'));
		const manager = new GraphTokenManager(CONFIG, fetchFn);

		expect(await manager.getToken()).to.equal('tok-1');

		expect(fetchFn.calledOnce).to.be.true;
		const [url, options] = fetchFn.firstCall.args;
		expect(url).to.equal('https://login.microsoftonline.com/tenant-1/oauth2/v2.0/token');
		expect(options.method).to.equal('POST');
		expect(options.body).to.include('grant_type=client_credentials');
		expect(options.body).to.include(`scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`);
	});

	it('should cache the token and refresh it when close to expiry', async () => {
		const fetchFn = sinon.stub();
		fetchFn.onFirstCall().resolves(tokenResponse('tok-1', 3600));
		fetchFn.onSecondCall().resolves(tokenResponse('tok-2', 3600));
		const manager = new GraphTokenManager(CONFIG, fetchFn);

		expect(await manager.getToken()).to.equal('tok-1');
		expect(await manager.getToken()).to.equal('tok-1');
		expect(fetchFn.calledOnce).to.be.true;

		// Advance to within the 2-minute safety margin of expiry
		clock.tick((3600 - 60) * 1000);
		expect(await manager.getToken()).to.equal('tok-2');
		expect(fetchFn.calledTwice).to.be.true;
	});

	it('should share a single in-flight request between concurrent callers', async () => {
		const fetchFn = sinon.stub().resolves(tokenResponse('tok-1'));
		const manager = new GraphTokenManager(CONFIG, fetchFn);

		const [a, b] = await Promise.all([manager.getToken(), manager.getToken()]);
		expect(a).to.equal('tok-1');
		expect(b).to.equal('tok-1');
		expect(fetchFn.calledOnce).to.be.true;
	});

	it('should fail fast without a network call when credentials are not configured', async () => {
		const fetchFn = sinon.stub();
		const manager = new GraphTokenManager({ ...CONFIG, clientSecret: '' }, fetchFn);

		await manager.getToken().then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('missing-credentials'),
		);
		expect(fetchFn.called).to.be.false;
	});

	const errorCases: [string, string][] = [
		['AADSTS90002: Tenant not found', 'invalid-tenant'],
		["AADSTS700016: Application with identifier 'x' was not found", 'invalid-client'],
		['AADSTS7000215: Invalid client secret provided', 'invalid-client-secret'],
		['AADSTS65001: The user or administrator has not consented', 'consent-missing'],
		['something else entirely', 'auth-failed'],
	];

	for (const [description, expectedCode] of errorCases) {
		it(`should map "${description.slice(0, 12)}..." to ${expectedCode}`, async () => {
			const fetchFn = sinon.stub().resolves(errorResponse(400, description));
			const manager = new GraphTokenManager(CONFIG, fetchFn);

			await manager.getToken().then(
				() => expect.fail('expected rejection'),
				(error) => expect(error.code).to.equal(expectedCode),
			);
		});
	}

	it('should send a client assertion instead of a secret when using certificate auth', async () => {
		const crypto = require('crypto');
		const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
		const certificatePem =
			'-----BEGIN CERTIFICATE-----\nMIICtjCCAZ4CCQDMv8cc+9Zt7DANBgkqhkiG9w0BAQsFADAdMRswGQYDVQQDDBJj\n-----END CERTIFICATE-----';

		const fetchFn = sinon.stub().resolves(tokenResponse('tok-1'));
		const manager = new GraphTokenManager(
			{
				...CONFIG,
				clientSecret: undefined,
				authMethod: 'certificate',
				certificatePem,
				privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
			},
			fetchFn,
		);

		expect(await manager.getToken()).to.equal('tok-1');
		const { body } = fetchFn.firstCall.args[1];
		expect(body).to.include(`client_assertion_type=${encodeURIComponent('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')}`);
		expect(body).to.include('client_assertion=');
		expect(body).to.not.include('client_secret');
	});

	it('should fail fast when certificate auth is selected but the key is missing', async () => {
		const fetchFn = sinon.stub();
		const manager = new GraphTokenManager({ ...CONFIG, clientSecret: undefined, authMethod: 'certificate' }, fetchFn);

		await manager.getToken().then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('missing-credentials'),
		);
		expect(fetchFn.called).to.be.false;
	});

	it('should map transport failures to network-error', async () => {
		const fetchFn = sinon.stub().rejects(new Error('ECONNREFUSED'));
		const manager = new GraphTokenManager(CONFIG, fetchFn);

		await manager.getToken().then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('network-error'),
		);
	});

	it('should allow a new request after invalidate()', async () => {
		const fetchFn = sinon.stub();
		fetchFn.onFirstCall().resolves(tokenResponse('tok-1'));
		fetchFn.onSecondCall().resolves(tokenResponse('tok-2'));
		const manager = new GraphTokenManager(CONFIG, fetchFn);

		expect(await manager.getToken()).to.equal('tok-1');
		manager.invalidate();
		expect(await manager.getToken()).to.equal('tok-2');
	});
});
