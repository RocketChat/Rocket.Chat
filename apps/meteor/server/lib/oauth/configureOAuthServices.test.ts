import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const updateOrCreateUserFromExternalService = sandbox.stub();
const routes = { get: sandbox.stub() };
const loginCallback = sandbox.stub();
const loginErrorCallback = sandbox.stub();

const { configureOAuthServices } = p.noCallThru().load('./configureOAuthServices.ts', {
	'meteor/accounts-base': { Accounts: { updateOrCreateUserFromExternalService } },
	'passport': { use: sandbox.stub(), unuse: sandbox.stub(), authenticate: sandbox.stub() },
	'./allowPassportOAuthMiddleware': { allowPassportOAuthMiddleware: () => sandbox.stub() },
	'./passportOAuthCallback': { passportOAuthCallback: () => loginCallback, passportOAuthErrorCallback: () => loginErrorCallback },
	'./removeOAuthRoutes': { removeOAuthRoutes: sandbox.stub() },
	'../../configuration/configurePassport': { oAuthRouter: routes },
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
});
