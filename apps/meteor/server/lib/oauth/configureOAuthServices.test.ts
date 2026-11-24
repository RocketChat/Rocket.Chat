import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const updateOrCreateUserFromExternalService = sandbox.stub();
const routes = { get: sandbox.stub() };
const authenticate = sandbox.stub();
const loginCallback = sandbox.stub();
const loginErrorCallback = sandbox.stub();

let configureOAuthServices: any;

before(async () => {
	mock.module(require.resolve('meteor/accounts-base'), { exports: { Accounts: { updateOrCreateUserFromExternalService } } });
	mock.module('passport', { exports: { default: { use: sandbox.stub(), unuse: sandbox.stub(), authenticate } } });
	mock.module('./allowPassportOAuthMiddleware', { exports: { allowPassportOAuthMiddleware: () => sandbox.stub() } });
	mock.module('./passportOAuthCallback', {
		exports: { passportOAuthCallback: () => loginCallback, passportOAuthErrorCallback: () => loginErrorCallback },
	});
	mock.module('./removeOAuthRoutes', { exports: { removeOAuthRoutes: sandbox.stub() } });
	mock.module('../../configuration/configurePassport', { exports: { oAuthRouter: routes } });
	({ configureOAuthServices } = await import('./configureOAuthServices'));
});

let verify: (...args: unknown[]) => Promise<unknown>;

class FakeStrategy {
	constructor(_options: unknown, verifyFunction: typeof verify) {
		verify = verifyFunction;
	}
}

const settings = { get: () => 'https://chat.example.com/' };

describe('configureOAuthServices', () => {
	beforeEach(() => {
		sandbox.resetHistory();
		configureOAuthServices(
			[{ provider: 'google', strategy: FakeStrategy, clientId: 'client-id', clientSecret: 'client-secret' }],
			settings,
		);
	});

	it('should hand a refused login to passport instead of leaving the request pending', async () => {
		const error = new Error('error-invalid-domain');
		updateOrCreateUserFromExternalService.rejects(error);
		const done = sandbox.stub();

		await verify('access-token', 'refresh-token', { id: 'external-id', displayName: 'Alice', emails: [] }, done);

		expect(done.calledOnceWith(error)).to.be.true;
	});

	it('should send a canceled sign-in back to the login page and answer other failures with the login error page', () => {
		const callbackRoute = routes.get.args.find(([path]) => path === '/_oauth/google');

		expect(callbackRoute?.slice(-2)).to.deep.equal([loginCallback, loginErrorCallback]);
		expect(authenticate.calledWithMatch('google', { failWithError: true, failureRedirect: 'https://chat.example.com/login' })).to.be.true;
	});
});
