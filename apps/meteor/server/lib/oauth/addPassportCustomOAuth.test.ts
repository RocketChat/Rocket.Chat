import { before, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const routes = { get: sinon.stub() };
const loginErrorCallback = sinon.stub();
const passportOAuthErrorCallback = sinon.stub().returns(loginErrorCallback);
const authenticate = sinon.stub();

let addPassportCustomOAuth: any;

before(async () => {
	const moduleMocks = [
		mock.module('passport', { exports: { default: { use: sinon.stub(), unuse: sinon.stub(), authenticate } } }),
		mock.module('./allowPassportOAuthMiddleware', { exports: { allowPassportOAuthMiddleware: () => sinon.stub() } }),
		mock.module('./passportOAuthCallback', { exports: { passportOAuthCallback: () => sinon.stub(), passportOAuthErrorCallback } }),
		mock.module('./removeOAuthRoutes', { exports: { removeOAuthRoutes: sinon.stub() } }),
		mock.module('./verifyFunction', { exports: { verifyFunction: sinon.stub() } }),
		mock.module('../../configuration/configurePassport', { exports: { oAuthRouter: routes } }),
		mock.module('../../settings', { exports: { settings: { get: () => 'https://chat.example.com/' } } }),
		mock.module('../auth-providers/custom-oauth/customOAuth', { exports: { CustomOAuthStrategy: class {} } }),
	];
	({ addPassportCustomOAuth } = await import('./addPassportCustomOAuth'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
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
