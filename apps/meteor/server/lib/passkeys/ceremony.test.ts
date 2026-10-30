import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const warn = sinon.stub();

const { assertPasskeysEnabled, getRelyingParty, getResponseChallenge, refusePasskey } = proxyquire.noCallThru().load('./ceremony', {
	'@rocket.chat/logger': {
		Logger: class {
			warn = warn;
		},
	},
	'../../settings': { settings: { get: settingsGet } },
});

const encodeClientData = (clientData: unknown) => Buffer.from(JSON.stringify(clientData)).toString('base64url');

const challenge = 'pS0TGBhTDmDN9w6FvQX1z6PEGXbLY0ufsWT6Gh3bO1Q';

describe('getResponseChallenge', () => {
	beforeEach(() => warn.reset());

	it('reads the challenge a same-origin response answers', () => {
		expect(getResponseChallenge(encodeClientData({ type: 'webauthn.get', challenge, origin: 'https://chat.example.com' }))).to.equal(
			challenge,
		);
		expect(getResponseChallenge(encodeClientData({ type: 'webauthn.get', challenge, crossOrigin: false }))).to.equal(challenge);
	});

	// the challenge is used as a query value, so anything but a plain string could select other challenges
	it('refuses a challenge that is not a base64url string', () => {
		for (const forged of [{ $ne: null }, { $gt: '' }, ['a'], 42, null, '', 'not base64url!', 'a'.repeat(129)]) {
			expect(() => getResponseChallenge(encodeClientData({ type: 'webauthn.get', challenge: forged }))).to.throw('error-passkey-invalid');
		}
	});

	it('refuses client data that is not JSON, or has no challenge', () => {
		expect(() => getResponseChallenge(Buffer.from('not json').toString('base64url'))).to.throw('error-passkey-invalid');
		expect(() => getResponseChallenge(encodeClientData(null))).to.throw('error-passkey-invalid');
		expect(() => getResponseChallenge(encodeClientData({ type: 'webauthn.get' }))).to.throw('error-passkey-invalid');
	});

	it('refuses a ceremony run in a cross-origin frame', () => {
		expect(() => getResponseChallenge(encodeClientData({ type: 'webauthn.get', challenge, crossOrigin: true }))).to.throw(
			'error-passkey-invalid',
		);
	});
});

describe('refusePasskey', () => {
	it('answers the same error whatever the reason, and logs the reason', () => {
		warn.reset();

		const error = refusePasskey('no passkey has this credential id', { passkeyId: 'passkey-id' });

		expect(error).to.have.property('error', 'error-passkey-invalid');
		expect(warn.calledOnceWith(sinon.match({ reason: 'no passkey has this credential id', passkeyId: 'passkey-id' }))).to.equal(true);
	});
});

describe('getRelyingParty', () => {
	it('binds passkeys to the host and origin of the Site URL', () => {
		settingsGet.withArgs('Site_Url').returns('https://chat.example.com:8443/workspace');
		settingsGet.withArgs('Site_Name').returns('Example');

		expect(getRelyingParty()).to.deep.equal({ id: 'chat.example.com', name: 'Example', origin: 'https://chat.example.com:8443' });
	});
});

describe('assertPasskeysEnabled', () => {
	it('refuses while passkeys are disabled', () => {
		settingsGet.withArgs('Accounts_Passkeys_Enabled').returns(false);
		expect(() => assertPasskeysEnabled()).to.throw('error-not-allowed');

		settingsGet.withArgs('Accounts_Passkeys_Enabled').returns(true);
		expect(() => assertPasskeysEnabled()).to.not.throw();
	});
});
