import { before, beforeEach, describe, it, mock } from 'node:test';
import { runInNewContext } from 'node:vm';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const LoginCodes = { createCode: sandbox.stub() };
const issueLoginToken = sandbox.stub();
const doesUserRequire2FA = sandbox.stub();
const sendTwoFactorChallenge = sandbox.stub();
const logError = sandbox.stub();

let passportOAuthCallback: any;
let passportOAuthErrorCallback: any;

before(async () => {
	const moduleMocks = [
		mock.module('../auth/issueLoginToken', { exports: { issueLoginToken } }),
		mock.module('./twoFactorAuth', { exports: { doesUserRequire2FA } }),
		mock.module('@rocket.chat/logger', {
			exports: {
				Logger: class {
					error = logError;
				},
			},
		}),
	];
	({ passportOAuthCallback, passportOAuthErrorCallback } = await import('./passportOAuthCallback'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const siteUrl = 'https://chat.example.com';
const user = { _id: 'user-id', username: 'alice' };

const callback = async (
	launchStyle: 'popup' | 'redirect',
	{ loginClient, oAuthUser = user }: { loginClient?: string; oAuthUser?: object | null } = {},
) => {
	const res = { redirect: sandbox.stub(), send: sandbox.stub(), setHeader: sandbox.stub() };
	const destroy = sandbox.stub();
	await passportOAuthCallback(siteUrl, launchStyle)({ user: oAuthUser, session: { loginClient, destroy } }, res);
	await new Promise(setImmediate);
	return { res, destroy };
};

const runPopupPage = (res: { send: sinon.SinonStub }, { opener }: { opener: 'open' | 'closed' | 'none' }) => {
	const html: string = res.send.firstCall.args[0];
	const script = html.slice(html.indexOf('>', html.indexOf('<script')) + 1, html.indexOf('</script>'));
	const sent: { to: string; message: unknown; targetOrigin?: string }[] = [];
	const close = sandbox.stub();
	const window = {
		location: { origin: siteUrl },
		opener:
			opener === 'none'
				? null
				: {
						closed: opener === 'closed',
						postMessage: (message: unknown, targetOrigin: string) => sent.push({ to: 'opener', message, targetOrigin }),
					},
		close,
	};
	class BroadcastChannel {
		constructor(private name: string) {}

		postMessage(message: unknown) {
			sent.push({ to: `channel ${this.name}`, message });
		}

		close() {
			return undefined;
		}
	}
	runInNewContext(script, { window, BroadcastChannel });
	return { sent: JSON.parse(JSON.stringify(sent)), closed: close.calledOnce };
};

const popupPayload = (res: { send: sinon.SinonStub }) => runPopupPage(res, { opener: 'open' }).sent[0].message;

describe('passportOAuthCallback', () => {
	before(() => {
		mockModel('LoginCodes', LoginCodes);
	});

	beforeEach(() => {
		sandbox.resetHistory();
		issueLoginToken.resolves({ token: 'resume-token', when: new Date() });
		LoginCodes.createCode.resolves('login-code');
		doesUserRequire2FA.returns(false);
		sendTwoFactorChallenge.resolves('challenge-id');
	});

	it('should send the visitor back to the login page when the provider authenticated nobody', async () => {
		const { res } = await callback('redirect', { oAuthUser: null });

		expect(res.redirect.calledOnceWith('/login')).to.be.true;
		expect(LoginCodes.createCode.called).to.be.false;
		expect(issueLoginToken.called).to.be.false;
	});

	describe('redirect login style', () => {
		it('should redirect home with a one-time login code instead of a session token, and end the OAuth session', async () => {
			const { res, destroy } = await callback('redirect');

			expect(res.redirect.calledOnceWith('https://chat.example.com/home?loginCode=login-code')).to.be.true;
			expect(LoginCodes.createCode.calledOnceWith('user-id')).to.be.true;
			expect(issueLoginToken.called).to.be.false;
			expect(destroy.calledOnce).to.be.true;
		});

		it('should keep the login client on the redirect', async () => {
			const { res } = await callback('redirect', { loginClient: 'desktop' });

			expect(res.redirect.calledOnceWith('https://chat.example.com/home?loginCode=login-code&loginClient=desktop')).to.be.true;
		});

		it('should send a user with two-factor authentication to the challenge without any login code', async () => {
			doesUserRequire2FA.returns({ method: 'totp', sendTwoFactorChallenge });

			const { res } = await callback('redirect', { loginClient: 'desktop' });

			expect(sendTwoFactorChallenge.calledOnceWith(user)).to.be.true;
			expect(res.redirect.calledOnceWith('https://chat.example.com/2fa/totp/challenge-id?loginClient=desktop')).to.be.true;
			expect(LoginCodes.createCode.called).to.be.false;
			expect(issueLoginToken.called).to.be.false;
		});
	});

	describe('popup login style', () => {
		it('should hand the session token only to a window of the same origin, under a script nonce', async () => {
			const { res } = await callback('popup');

			expect(issueLoginToken.calledOnceWith('user-id')).to.be.true;
			expect(popupPayload(res)).to.deep.equal({ oauthPopupCommand: 'oauth-login-with-token', token: 'resume-token' });

			expect(runPopupPage(res, { opener: 'open' }).sent).to.have.nested.property('[0].targetOrigin', siteUrl);
			const html: string = res.send.firstCall.args[0];
			const [, nonce] = /nonce="([^"]+)"/.exec(html) ?? [];
			expect(res.setHeader.calledOnceWith('Content-Security-Policy', `script-src 'nonce-${nonce}'`)).to.be.true;
		});

		it('should hand the session token to the workspace tabs when the provider cut the popup off from its opener', async () => {
			const { res } = await callback('popup');

			expect(runPopupPage(res, { opener: 'none' })).to.deep.equal({
				sent: [{ to: 'channel oauth-popup', message: { oauthPopupCommand: 'oauth-login-with-token', token: 'resume-token' } }],
				closed: true,
			});
		});

		it('should hand the session token to the workspace tabs when the tab that opened the popup was closed', async () => {
			const { res } = await callback('popup');

			expect(runPopupPage(res, { opener: 'closed' }).sent).to.deep.equal([
				{ to: 'channel oauth-popup', message: { oauthPopupCommand: 'oauth-login-with-token', token: 'resume-token' } },
			]);
		});

		it('should redirect a login client home with the session token', async () => {
			const { res } = await callback('popup', { loginClient: 'desktop' });

			expect(popupPayload(res)).to.deep.equal({
				oauthPopupCommand: 'redirect',
				path: 'home?resumeToken=resume-token&userId=user-id&loginClient=desktop',
			});
		});

		it('should send a user with two-factor authentication to the challenge without any session token', async () => {
			doesUserRequire2FA.returns({ method: 'email', sendTwoFactorChallenge });

			const { res } = await callback('popup');

			expect(popupPayload(res)).to.deep.equal({ oauthPopupCommand: 'redirect', path: '/2fa/email/challenge-id' });
			expect(issueLoginToken.called).to.be.false;
		});
	});
});

describe('passportOAuthErrorCallback', () => {
	beforeEach(() => {
		sandbox.resetHistory();
	});

	const fail = (launchStyle: 'popup' | 'redirect', error: unknown, workspaceUrl = siteUrl) => {
		const res = { redirect: sandbox.stub(), send: sandbox.stub(), setHeader: sandbox.stub() };
		passportOAuthErrorCallback(workspaceUrl, launchStyle)(error, {}, res, sandbox.stub());
		return res;
	};

	it('should send the visitor back home with the reason the login was refused', () => {
		const res = fail('redirect', new ClientSafeError('error-invalid-username', 'alice@example.com is not a valid username'));

		expect(res.redirect.calledOnceWith('https://chat.example.com/home?oauthError=error-invalid-username')).to.be.true;
	});

	it('should keep the workspace path when the workspace runs under a subpath', () => {
		const res = fail('redirect', new Error('User not found'), 'https://example.com/chat');

		expect(res.redirect.calledOnceWith('https://example.com/chat/home?oauthError=error-oauth-login-failed')).to.be.true;
	});

	it('should hide the reason of any other error behind a generic one, keeping it in the server log', () => {
		const error = new ClientSafeError('CustomOAuth', 'User with username alice already exists');
		const res = fail('redirect', error);

		expect(res.redirect.calledOnceWith('https://chat.example.com/home?oauthError=error-oauth-login-failed')).to.be.true;
		expect(logError.calledOnceWith(sinon.match({ err: error }))).to.be.true;
	});

	it('should hand the reason to the opener window when the login runs in a popup', () => {
		const res = fail('popup', new Error('User not found'));

		expect(popupPayload(res)).to.deep.equal({ oauthPopupCommand: 'login-error', oauthError: 'error-oauth-login-failed' });
	});
});
