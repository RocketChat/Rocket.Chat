import { describe, it, beforeEach, afterEach } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { workspaceScopes } from './oauthScopes';

class CloudWorkspaceAccessTokenError extends Error {}

const hasOfflineLicenseStub = sinon.stub();
const retrieveRegistrationStatusStub = sinon.stub();
const removeWorkspaceRegistrationInfoStub = sinon.stub();
const fetchStub = sinon.stub();
const settingsGetStub = sinon.stub();
const loggerErrorStub = sinon.stub();

const { getWorkspaceAccessTokenWithScope } = proxyquire.noCallThru().load('./getWorkspaceAccessTokenWithScope.ts', {
	'@rocket.chat/license': { License: { hasOfflineLicense: hasOfflineLicenseStub } },
	'@rocket.chat/server-fetch': { serverFetch: fetchStub },
	'./getRedirectUri': { getRedirectUri: () => 'https://open.rocket.chat/admin/cloud/oauth-callback' },
	'./getWorkspaceAccessToken': { CloudWorkspaceAccessTokenError },
	'./removeWorkspaceRegistrationInfo': { removeWorkspaceRegistrationInfo: removeWorkspaceRegistrationInfoStub },
	'./retrieveRegistrationStatus': { retrieveRegistrationStatus: retrieveRegistrationStatusStub },
	'../../settings': { settings: { get: settingsGetStub } },
	'../logger/system': { SystemLogger: { error: loggerErrorStub } },
});

const now = new Date('2026-10-15T12:00:00.000Z');
const emptyResult = { token: '', expiresAt: now, scope: '' };

const respond = (status: number, payload: unknown) => fetchStub.resolves({ status, json: async () => payload });

describe('getWorkspaceAccessTokenWithScope', () => {
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		clock = sinon.useFakeTimers({ now, toFake: ['Date'] });
		removeWorkspaceRegistrationInfoStub.reset();
		fetchStub.reset();
		loggerErrorStub.reset();

		retrieveRegistrationStatusStub.resolves({ workspaceRegistered: true });
		hasOfflineLicenseStub.returns(false);
		settingsGetStub.withArgs('Cloud_Workspace_Client_Id').returns('client-id');
		settingsGetStub.withArgs('Cloud_Workspace_Client_Secret').returns('client-secret');
		settingsGetStub.withArgs('Cloud_Url').returns('https://cloud.rocket.chat');
	});

	afterEach(() => {
		clock.restore();
	});

	describe('registration checks', () => {
		it('should return an empty token without contacting cloud when the workspace is not registered', async () => {
			retrieveRegistrationStatusStub.resolves({ workspaceRegistered: false });

			expect(await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase' })).to.deep.equal(emptyResult);
			expect(fetchStub.called).to.be.false;
		});

		it('should return an empty token without contacting cloud when the license is offline', async () => {
			hasOfflineLicenseStub.returns(true);

			expect(await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase' })).to.deep.equal(emptyResult);
			expect(fetchStub.called).to.be.false;
		});

		it('should return an empty token without contacting cloud when the workspace has no client id', async () => {
			settingsGetStub.withArgs('Cloud_Workspace_Client_Id').returns('');

			expect(await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase' })).to.deep.equal(emptyResult);
			expect(fetchStub.called).to.be.false;
		});
	});

	describe('token requests', () => {
		it('should request the given scope with the client credentials grant and return the issued token', async () => {
			respond(200, { access_token: 'access-token', expires_in: 3600, scope: 'marketplace:purchase' });

			const result = await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase' });

			expect(result).to.deep.equal({
				token: 'access-token',
				expiresAt: new Date('2026-10-15T13:00:00.000Z'),
				scope: 'marketplace:purchase',
			});
			const [url, { method, body }] = fetchStub.firstCall.args;
			expect(url).to.equal('https://cloud.rocket.chat/api/oauth/token');
			expect(method).to.equal('POST');
			expect(Object.fromEntries(body)).to.deep.equal({
				client_id: 'client-id',
				client_secret: 'client-secret',
				scope: 'marketplace:purchase',
				grant_type: 'client_credentials',
				redirect_uri: 'https://open.rocket.chat/admin/cloud/oauth-callback',
			});
		});

		it('should request the default workspace scopes when no scope is given', async () => {
			respond(200, { access_token: 'access-token', expires_in: 3600, scope: 'workspace:license:read' });

			const result = await getWorkspaceAccessTokenWithScope({});

			expect(result.scope).to.equal('workspace:license:read');
			expect(fetchStub.firstCall.args[1].body.get('scope')).to.equal(workspaceScopes.join(' '));
		});
	});

	describe('error handling', () => {
		it('should drop the cloud registration and return an empty token when cloud rejects the client credentials', async () => {
			respond(401, { error: 'oauth_invalid_client_credentials' });

			expect(await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase' })).to.deep.equal(emptyResult);
			expect(loggerErrorStub.calledOnce).to.be.true;
			expect(removeWorkspaceRegistrationInfoStub.calledOnce).to.be.true;
		});

		it('should drop the cloud registration and throw when cloud rejects the client credentials and throwOnError is set', async () => {
			respond(401, { error: 'oauth_invalid_client_credentials' });

			await expect(getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase', throwOnError: true })).to.be.rejectedWith(
				CloudWorkspaceAccessTokenError,
			);
			expect(removeWorkspaceRegistrationInfoStub.calledOnce).to.be.true;
		});

		it('should keep the registration when cloud fails with another error', async () => {
			respond(500, { error: 'server_error' });

			await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase', throwOnError: true });

			expect(removeWorkspaceRegistrationInfoStub.called).to.be.false;
		});

		it('should return an empty token and keep the registration when cloud cannot be reached, even if throwOnError is set', async () => {
			fetchStub.rejects(new Error('ECONNREFUSED'));

			expect(await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase', throwOnError: true })).to.deep.equal(emptyResult);
			expect(removeWorkspaceRegistrationInfoStub.called).to.be.false;
		});

		it('should return an empty token and keep the registration when cloud answers with a non-JSON body, even if throwOnError is set', async () => {
			fetchStub.resolves({
				status: 502,
				json: async () => {
					throw new SyntaxError('Unexpected token < in JSON');
				},
			});

			expect(await getWorkspaceAccessTokenWithScope({ scope: 'marketplace:purchase', throwOnError: true })).to.deep.equal(emptyResult);
			expect(removeWorkspaceRegistrationInfoStub.called).to.be.false;
		});
	});
});
