import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const LoginCodes = { createCode: sandbox.stub() };
const issueLoginToken = sandbox.stub();
const doesUserRequire2FA = sandbox.stub();
const sendTwoFactorChallenge = sandbox.stub();

const { passportOAuthCallback } = p.noCallThru().load('./passportOAuthCallback.ts', {
	'../auth/issueLoginToken': { issueLoginToken },
	'./twoFactorAuth': { doesUserRequire2FA },
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

const popupPayload = (res: { send: sinon.SinonStub }) => {
	const html: string = res.send.firstCall.args[0];
	return JSON.parse(html.slice(html.indexOf('postMessage(') + 'postMessage('.length, html.lastIndexOf(',')));
};

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

			const html: string = res.send.firstCall.args[0];
			const postMessageCall = html.slice(
				html.indexOf('postMessage(') + 'postMessage('.length,
				html.indexOf(');', html.indexOf('postMessage(')),
			);
			expect(postMessageCall.slice(postMessageCall.lastIndexOf(',') + 1).trim()).to.equal('window.location.origin');
			const [, nonce] = /nonce="([^"]+)"/.exec(html) ?? [];
			expect(res.setHeader.calledOnceWith('Content-Security-Policy', `script-src 'nonce-${nonce}'`)).to.be.true;
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
