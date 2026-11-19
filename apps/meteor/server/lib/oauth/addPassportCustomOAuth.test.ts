import { describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const routes = { get: sinon.stub() };
const loginErrorCallback = sinon.stub();
const passportOAuthErrorCallback = sinon.stub().returns(loginErrorCallback);
const authenticate = sinon.stub();

const { addPassportCustomOAuth } = p.noCallThru().load('./addPassportCustomOAuth.ts', {
	'passport': { use: sinon.stub(), unuse: sinon.stub(), authenticate },
	'./allowPassportOAuthMiddleware': { allowPassportOAuthMiddleware: () => sinon.stub() },
	'./passportOAuthCallback': { passportOAuthCallback: () => sinon.stub(), passportOAuthErrorCallback },
	'./removeOAuthRoutes': { removeOAuthRoutes: sinon.stub() },
	'./verifyFunction': { verifyFunction: sinon.stub() },
	'../../configuration/configurePassport': { oAuthRouter: routes },
	'../../settings': { settings: { get: () => 'https://chat.example.com/' } },
	'../auth-providers/custom-oauth/customOAuth': { CustomOAuthStrategy: class {} },
});

describe('addPassportCustomOAuth', () => {
	it('should send a canceled sign-in back to the login page and answer other failures with the login error page of its login style', () => {
		addPassportCustomOAuth(
			'fakeidp',
			{ clientId: 'client-id', clientSecret: 'client-secret', serverURL: 'https://idp.example.com', loginStyle: 'popup' },
			true,
		);

		const callbackRoute = routes.get.args.find(([path]) => path === '/_oauth/fakeidp');

		expect(callbackRoute?.at(-1)).to.equal(loginErrorCallback);
		expect(passportOAuthErrorCallback.calledOnceWith('https://chat.example.com', 'popup')).to.be.true;
		expect(authenticate.calledWithMatch('fakeidp', { failWithError: true, failureRedirect: 'https://chat.example.com/login' })).to.be.true;
	});
});
