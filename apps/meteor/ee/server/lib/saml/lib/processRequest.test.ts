import { afterEach, before, beforeEach, describe, it } from 'node:test';

import type { ICredentialTokensModel, ISamlUsedAssertionsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { SAMLUtils } from './Utils';
import { serviceProviderOptions } from '../../../../../tests/mocks/server/lib/saml/data';

const HOME_URL = 'http://localhost:3000/';
const IDP_LOGOUT_URL = 'https://idp.example/logout/redirect';

const getSAMLEnvelope = sinon.stub();
const validateLogoutRequest = sinon.stub();
const validateLogoutResponse = sinon.stub();
const validateResponse = sinon.stub();

const findBySAMLNameIdOrIdpSession = sinon.stub();
const findBySAMLInResponseTo = sinon.stub();
const unsetLoginTokens = sinon.stub();
const removeSamlServiceSession = sinon.stub();
const markUsed = sinon.stub();
const createCredential = sinon.stub();
const findCredential = sinon.stub();
const generateLogoutResponse = sinon.stub();
const logoutResponseToUrl = sinon.stub();
const getAuthorizeUrl = sinon.stub();
const generateServiceProviderMetadata = sinon.stub();

class SAMLServiceProvider {
	validateLogoutRequest = validateLogoutRequest;

	validateLogoutResponse = validateLogoutResponse;

	validateResponse = validateResponse;

	generateLogoutResponse = generateLogoutResponse;

	logoutResponseToUrl = logoutResponseToUrl;

	getAuthorizeUrl = getAuthorizeUrl;

	generateServiceProviderMetadata = generateServiceProviderMetadata;
}

const { SAML } = proxyquire.noCallThru().load('./SAML', {
	'meteor/accounts-base': { Accounts: {} },
	'meteor/meteor': { Meteor: { absoluteUrl: (path = '') => `${HOME_URL}${path}` } },
	'./ServiceProvider': { SAMLServiceProvider },
	'./getSAMLEnvelope': { getSAMLEnvelope },
	'../../../../../server/lib/rooms/addUserToRoom': {},
	'../../../../../server/lib/rooms/createRoom': {},
	'../../../../../server/lib/users/getUsernameSuggestion': {},
	'../../../../../server/lib/users/saveUserIdentity': {},
	'../../../../../server/settings': { settings: {} },
});

const buildResponse = () => {
	const response = {
		status: undefined as number | undefined,
		location: undefined as string | undefined,
		body: undefined as string | undefined,
		written: undefined as string | undefined,
		ended: false,
		writeHead(status: number, headers?: { Location?: string }) {
			response.status = status;
			response.location = headers?.Location;
		},
		write(content: string) {
			response.written = content;
			return true;
		},
		end(body?: string) {
			response.body = body;
			response.ended = true;
		},
	};
	return response;
};

const cursorOf = (users: { _id: string }[]) => ({ toArray: async () => users });

const service = { ...serviceProviderOptions, idpSLORedirectURL: IDP_LOGOUT_URL };

const processRequest = async (actionName: string, query: Record<string, unknown> = {}, options: Record<string, unknown> = service) => {
	const res = buildResponse();
	await SAML.processRequest({ query }, res, options, { actionName, serviceName: 'test-sp', credentialToken: '' });
	return res;
};

describe('SAML requests', () => {
	before(() => {
		registerModel('IUsersModel', {
			findBySAMLNameIdOrIdpSession,
			findBySAMLInResponseTo,
			unsetLoginTokens,
			removeSamlServiceSession,
		} as unknown as IUsersModel);
		registerModel('ISamlUsedAssertionsModel', { markUsed } as unknown as ISamlUsedAssertionsModel);
		registerModel('ICredentialTokensModel', {
			create: createCredential,
			findOneNotExpiredById: findCredential,
		} as unknown as ICredentialTokensModel);
	});

	beforeEach(() => {
		for (const stub of [
			getSAMLEnvelope,
			validateLogoutRequest,
			validateLogoutResponse,
			validateResponse,
			findBySAMLNameIdOrIdpSession,
			findBySAMLInResponseTo,
			unsetLoginTokens,
			removeSamlServiceSession,
			markUsed,
			createCredential,
			findCredential,
			generateLogoutResponse,
			logoutResponseToUrl,
			getAuthorizeUrl,
			generateServiceProviderMetadata,
		]) {
			stub.reset();
		}
		getSAMLEnvelope.resolves({ relayState: null });
		markUsed.resolves(true);
		createCredential.resolves();
		generateLogoutResponse.returns({ response: 'logout-response' });
		logoutResponseToUrl.callsFake((_response, _relayState, callback) => callback(null, 'https://idp.example/logout-response'));
	});

	describe('reading a stored login result', () => {
		it('should say whether a credential is still valid', async () => {
			findCredential.withArgs('valid-token').resolves({ userInfo: {} });
			findCredential.withArgs('expired-token').resolves(null);

			expect(await SAML.hasCredential('valid-token')).to.be.true;
			expect(await SAML.hasCredential('expired-token')).to.be.false;
		});

		it('should return the login result of a valid credential and nothing for an expired one', async () => {
			findCredential.withArgs('valid-token').resolves({ userInfo: { profile: { nameID: 'name-id' } } });
			findCredential.withArgs('expired-token').resolves(null);

			expect(await SAML.retrieveCredential('valid-token')).to.deep.equal({ profile: { nameID: 'name-id' } });
			expect(await SAML.retrieveCredential('expired-token')).to.be.undefined;
		});
	});

	describe('metadata', () => {
		it('should serve the metadata of the service provider', async () => {
			generateServiceProviderMetadata.returns('<EntityDescriptor/>');

			const res = await processRequest('metadata');

			expect(res.status).to.equal(200);
			expect(res.written).to.equal('<EntityDescriptor/>');
			expect(res.ended).to.be.true;
		});

		it('should show an error page when the metadata cannot be generated', async () => {
			generateServiceProviderMetadata.throws(new Error('Missing certificate'));

			const res = await processRequest('metadata');

			expect(res.written).to.be.undefined;
			expect(res.body).to.include('Missing certificate');
		});
	});

	describe('starting a login', () => {
		const authorize = async () => {
			const res = buildResponse();
			await SAML.processRequest({ query: {} }, res, service, { actionName: 'authorize', serviceName: 'test-sp', credentialToken: 'token' });
			return res;
		};

		it('should send the browser to the IdP with the credential token', async () => {
			getAuthorizeUrl.withArgs('token', undefined).resolves('https://idp.example/sso');

			const res = await authorize();

			expect(res.status).to.equal(302);
			expect(res.location).to.equal('https://idp.example/sso');
			expect(res.ended).to.be.true;
		});

		it('should send the browser home when the IdP address cannot be built', async () => {
			getAuthorizeUrl.rejects(new Error('Invalid certificate'));

			const res = await authorize();

			expect(res.location).to.equal(HOME_URL);
		});
	});

	describe('unknown requests', () => {
		it('should refuse a request for a service that is not configured', async () => {
			const samlObject = { actionName: 'authorize', serviceName: 'unknown-sp', credentialToken: '' };

			await expect(SAML.processRequest({ query: {} }, buildResponse(), undefined, samlObject)).to.be.rejectedWith(
				'Unexpected SAML service',
			);
		});

		it('should refuse an unknown action', async () => {
			await expect(processRequest('other-action')).to.be.rejectedWith('Unexpected SAML action');
		});

		it('should escape the service name of the URL on the metadata error page', async () => {
			const res = buildResponse();
			const samlObject = { actionName: 'metadata', serviceName: '<script>alert(1)</script>', credentialToken: '' };

			await SAML.processRequest({ query: {} }, res, undefined, samlObject);

			expect(res.body).to.include('&lt;script&gt;');
			expect(res.body).to.not.include('<script>');
		});
	});

	describe('redirecting to the IdP single logout page', () => {
		const expectNoRedirect = (res: ReturnType<typeof buildResponse>, status: number) => {
			expect(res.status).to.equal(status);
			expect(res.location).to.be.undefined;
		};

		it('should redirect to the configured logout page and keep the query of the request', async () => {
			const res = await processRequest('sloRedirect', { redirect: `${IDP_LOGOUT_URL}?SAMLRequest=request` });

			expect(res.status).to.equal(302);
			expect(res.location).to.equal(`${IDP_LOGOUT_URL}?SAMLRequest=request`);
			expect(res.ended).to.be.true;
		});

		it('should accept the configured path with a different trailing slash', async () => {
			const res = await processRequest('sloRedirect', { redirect: `${IDP_LOGOUT_URL}/` });

			expect(res.status).to.equal(302);
		});

		it('should refuse a redirect to another host', async () => {
			const res = await processRequest('sloRedirect', { redirect: 'https://attacker.example/logout/redirect' });

			expectNoRedirect(res, 403);
		});

		it('should refuse a redirect to another scheme or port of the IdP host', async () => {
			expectNoRedirect(await processRequest('sloRedirect', { redirect: 'http://idp.example/logout/redirect' }), 403);
			expectNoRedirect(await processRequest('sloRedirect', { redirect: 'https://idp.example:8443/logout/redirect' }), 403);
		});

		it('should refuse a redirect to another path of the IdP host', async () => {
			const res = await processRequest('sloRedirect', { redirect: 'https://idp.example/open-redirect' });

			expectNoRedirect(res, 403);
		});

		it('should refuse a request with no redirect or more than one', async () => {
			expectNoRedirect(await processRequest('sloRedirect'), 400);
			expectNoRedirect(await processRequest('sloRedirect', { redirect: [IDP_LOGOUT_URL, 'https://attacker.example'] }), 400);
		});

		it('should refuse a redirect that is not a URL', async () => {
			const res = await processRequest('sloRedirect', { redirect: '/logout/redirect' });

			expectNoRedirect(res, 400);
		});

		it('should refuse every redirect when no logout page is configured', async () => {
			const res = await processRequest('sloRedirect', { redirect: IDP_LOGOUT_URL }, { ...service, idpSLORedirectURL: '' });

			expectNoRedirect(res, 500);
		});
	});

	describe('receiving a logout request from the IdP', () => {
		const logoutRequest = { id: 'request-id', nameID: 'name-id', idpSession: 'session' };

		const receiveLogoutRequest = async (result: Record<string, unknown> = logoutRequest, error: Error | null = null) => {
			let pending: Promise<void> | undefined;
			validateLogoutRequest.callsFake(async (_envelope, callback) => {
				pending = callback(error, result);
			});
			const res = await processRequest('logout', { SAMLRequest: 'request' });
			await pending;
			return res;
		};

		it('should end the sessions of the matching user and answer the IdP', async () => {
			findBySAMLNameIdOrIdpSession.returns(cursorOf([{ _id: 'user-id' }]));

			const res = await receiveLogoutRequest();

			expect(unsetLoginTokens.calledOnceWith('user-id')).to.be.true;
			expect(removeSamlServiceSession.calledOnceWith('user-id')).to.be.true;
			expect(getSAMLEnvelope.firstCall.args.slice(1)).to.deep.equal(['SAMLRequest', 'HTTP-Redirect']);
			expect(res.location).to.equal('https://idp.example/logout-response');
			expect(res.ended).to.be.true;
		});

		it('should answer the IdP about this request and keep its relay state', async () => {
			getSAMLEnvelope.resolves({ relayState: 'relay-state' });
			findBySAMLNameIdOrIdpSession.returns(cursorOf([{ _id: 'user-id' }]));

			await receiveLogoutRequest();

			expect(generateLogoutResponse.calledOnceWith({ nameID: 'name-id', sessionIndex: 'session', inResponseToId: 'request-id' })).to.be
				.true;
			expect(logoutResponseToUrl.firstCall.args.slice(0, 2)).to.deep.equal(['logout-response', 'relay-state']);
		});

		it('should send the browser home when the answer to the IdP cannot be built', async () => {
			findBySAMLNameIdOrIdpSession.returns(cursorOf([{ _id: 'user-id' }]));
			logoutResponseToUrl.callsFake((_response, _relayState, callback) => callback(new Error('Unable to sign')));

			const res = await receiveLogoutRequest();

			expect(res.location).to.equal(HOME_URL);
		});

		it('should send the browser home when the IdP address takes too long to build', async () => {
			const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
			findBySAMLNameIdOrIdpSession.returns(cursorOf([{ _id: 'user-id' }]));
			logoutResponseToUrl.callsFake(() => undefined);

			try {
				const res = await receiveLogoutRequest();
				expect(res.ended).to.be.false;

				clock.tick(5000);

				expect(res.location).to.equal(HOME_URL);
				expect(res.ended).to.be.true;
			} finally {
				clock.restore();
			}
		});

		it('should end no session for a request that fails validation', async () => {
			await expect(receiveLogoutRequest(logoutRequest, new Error('Invalid signature'))).to.be.rejectedWith(
				'Unable to Validate Logout Request',
			);

			expect(findBySAMLNameIdOrIdpSession.called).to.be.false;
			expect(unsetLoginTokens.called).to.be.false;
		});

		it('should refuse a request with no envelope', async () => {
			getSAMLEnvelope.resolves(undefined);

			await expect(processRequest('logout', { SAMLRequest: 'request' })).to.be.rejectedWith('Unable to Validate Logout Request');

			expect(validateLogoutRequest.called).to.be.false;
		});

		it('should end no session when more than one user matches', async () => {
			findBySAMLNameIdOrIdpSession.returns(cursorOf([{ _id: 'user-1' }, { _id: 'user-2' }]));

			const res = await receiveLogoutRequest();

			expect(unsetLoginTokens.called).to.be.false;
			expect(res.location).to.equal(HOME_URL);
		});

		it('should end no session when the request does not name the user and the session', async () => {
			await expect(receiveLogoutRequest({ id: 'request-id', nameID: 'name-id' })).to.be.rejectedWith('missing request data');

			expect(findBySAMLNameIdOrIdpSession.called).to.be.false;
			expect(unsetLoginTokens.called).to.be.false;
		});
	});

	describe('receiving a logout response from the IdP', () => {
		const receiveLogoutResponse = async (inResponseTo?: string, error: Error | null = null) => {
			let pending: Promise<void> | undefined;
			validateLogoutResponse.callsFake(async (_envelope, callback) => {
				pending = callback(error, inResponseTo);
			});
			const res = buildResponse();
			await SAML.processRequest({ query: {} }, res, service, { actionName: 'logout', serviceName: 'test-sp', credentialToken: '' });
			const failure = await pending?.then(() => undefined).catch((error) => error);
			return { res, failure };
		};

		it('should end the sessions of the user who started the logout and send the browser home', async () => {
			findBySAMLInResponseTo.returns(cursorOf([{ _id: 'user-id' }]));

			const { res } = await receiveLogoutResponse('logout-id');

			expect(unsetLoginTokens.calledOnceWith('user-id')).to.be.true;
			expect(getSAMLEnvelope.firstCall.args.slice(1)).to.deep.equal(['SAMLResponse', 'HTTP-Redirect']);
			expect(res.location).to.equal(HOME_URL);
			expect(res.ended).to.be.true;
		});

		it('should end no session and still send the browser home when more than one user matches', async () => {
			findBySAMLInResponseTo.returns(cursorOf([{ _id: 'user-1' }, { _id: 'user-2' }]));

			const { res, failure } = await receiveLogoutResponse('logout-id');

			expect(failure).to.have.property('error', 'Found multiple users matching SAML inResponseTo fields');
			expect(unsetLoginTokens.called).to.be.false;
			expect(res.location).to.equal(HOME_URL);
		});

		it('should end no session for a response that names no logout', async () => {
			const { failure } = await receiveLogoutResponse(undefined);

			expect(failure).to.have.property('error', 'Invalid logout request: no inResponseTo value.');
			expect(findBySAMLInResponseTo.called).to.be.false;
		});

		it('should end no session for a response that fails validation', async () => {
			const { failure } = await receiveLogoutResponse('logout-id', new Error('Invalid signature'));

			expect(failure).to.have.property('message', 'Logout Response Validation failed');
			expect(findBySAMLInResponseTo.called).to.be.false;
			expect(unsetLoginTokens.called).to.be.false;
		});

		it('should refuse a response with no envelope', async () => {
			getSAMLEnvelope.resolves(undefined);

			await expect(
				SAML.processRequest({ query: {} }, buildResponse(), service, { actionName: 'logout', serviceName: 'test-sp', credentialToken: '' }),
			).to.be.rejectedWith('Invalid LogoutResponse received.');

			expect(validateLogoutResponse.called).to.be.false;
		});
	});

	describe('receiving a login response from the IdP', () => {
		let clock: sinon.SinonFakeTimers | undefined;

		const profile = { assertionId: 'assertion-id', issuer: 'issuer', expireAt: new Date('2030-01-01T00:00:00.000Z') };

		const receiveLoginResponse = async (error: Error | null, result?: Record<string, unknown>, options = service) => {
			let pending: Promise<void> | undefined;
			validateResponse.callsFake((_envelope, callback) => {
				pending = callback(error, result);
			});
			const res = await processRequest('validate', {}, options);
			await pending;
			return res;
		};

		afterEach(() => {
			clock?.restore();
			clock = undefined;
			SAMLUtils.relayState = null;
		});

		it('should store the profile and send the browser to finish the login with that credential', async () => {
			const res = await receiveLoginResponse(null, profile);

			const [credentialToken, loginResult] = createCredential.firstCall.args;
			expect(loginResult).to.deep.equal({ profile });
			expect(res.location).to.equal(`${HOME_URL}saml/${credentialToken}?saml_idp_credentialToken=${credentialToken}`);
			expect(res.ended).to.be.true;
		});

		it('should keep the login client of the desktop and mobile apps', async () => {
			getSAMLEnvelope.resolves({ relayState: 'provider=test-sp&loginClient=desktop' });

			const res = await receiveLoginResponse(null, profile);

			expect(res.location).to.match(/&loginClient=desktop$/);
			expect(SAMLUtils.relayState).to.equal('test-sp');
		});

		it('should store no credential for a response that fails validation', async () => {
			const res = await receiveLoginResponse(new Error('Invalid signature'), profile);

			expect(createCredential.called).to.be.false;
			expect(markUsed.called).to.be.false;
			expect(res.location).to.equal(HOME_URL);
		});

		it('should store no credential for an assertion that cannot be checked for replay', async () => {
			await receiveLoginResponse(null, { ...profile, assertionId: undefined });
			await receiveLoginResponse(null, { ...profile, issuer: undefined });

			expect(markUsed.called).to.be.false;
			expect(createCredential.called).to.be.false;
		});

		it('should remember a used assertion until it expires plus the allowed clock drift', async () => {
			await receiveLoginResponse(null, profile, { ...service, allowedClockDrift: 60_000 });

			expect(markUsed.firstCall.args[2]).to.deep.equal(new Date(profile.expireAt.getTime() + 60_000));
		});

		it('should remember for five minutes an assertion that has no expiry', async () => {
			clock = sinon.useFakeTimers({ now: new Date('2030-01-01T00:00:00.000Z'), toFake: ['Date'] });

			await receiveLoginResponse(null, { ...profile, expireAt: undefined });

			expect(markUsed.firstCall.args[2]).to.deep.equal(new Date('2030-01-01T00:05:00.000Z'));
		});

		it('should send the browser home when the response has no envelope', async () => {
			getSAMLEnvelope.resolves(undefined);

			const res = await processRequest('validate');

			expect(validateResponse.called).to.be.false;
			expect(res.location).to.equal(HOME_URL);
		});
	});
});
