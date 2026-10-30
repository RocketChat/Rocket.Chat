import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const assertPasskeysEnabled = sinon.stub();
const countByUserId = sinon.stub();
const findPasskeysByUserId = sinon.stub();
const insertUnlessCredentialExists = sinon.stub();
const createChallenge = sinon.stub();
const findOneNotExpiredForRegistrationByUserIdAndDelete = sinon.stub();
const generateRegistrationOptions = sinon.stub();
const verifyRegistrationResponse = sinon.stub();

const ceremony = proxyquire.noCallThru().load('./ceremony', {
	'@rocket.chat/logger': {
		Logger: class {
			warn = () => undefined;
		},
	},
	'../../settings': { settings: { get: () => undefined } },
});

const { createPasskeyRegistrationOptions, registerPasskey } = proxyquire.noCallThru().load('./registerPasskey', {
	'@rocket.chat/models': {
		PasskeyChallenges: { createChallenge, findOneNotExpiredForRegistrationByUserIdAndDelete },
		Passkeys: { countByUserId, findByUserId: findPasskeysByUserId, insertUnlessCredentialExists },
	},
	'@simplewebauthn/server': { generateRegistrationOptions, verifyRegistrationResponse },
	'./ceremony': {
		...ceremony,
		assertPasskeysEnabled,
		getRelyingParty: () => ({ id: 'chat.example.com', name: 'Example', origin: 'https://chat.example.com' }),
	},
});

const challenge = 'pS0TGBhTDmDN9w6FvQX1z6PEGXbLY0ufsWT6Gh3bO1Q';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const createResponse = (clientData: unknown = { type: 'webauthn.create', challenge }): RegistrationResponseJSON => ({
	id: 'Y3JlZGVudGlhbA',
	rawId: 'Y3JlZGVudGlhbA',
	type: 'public-key',
	authenticatorAttachment: 'platform',
	clientExtensionResults: {},
	response: { clientDataJSON: Buffer.from(JSON.stringify(clientData)).toString('base64url'), attestationObject: 'YQ' },
});

const registrationInfo = {
	credential: { id: 'Y3JlZGVudGlhbA', publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal', 'hybrid'] },
	aaguid: '00000000-0000-0000-0000-000000000000',
	credentialDeviceType: 'multiDevice',
	credentialBackedUp: true,
};

describe('createPasskeyRegistrationOptions', () => {
	beforeEach(() => {
		for (const stub of [assertPasskeysEnabled, countByUserId, findPasskeysByUserId, createChallenge, generateRegistrationOptions]) {
			stub.reset();
		}
		countByUserId.resolves(1);
		findPasskeysByUserId.returns({
			map: (fn: (passkey: unknown) => unknown) => ({ toArray: async () => [fn({ credentialId: 'existing', transports: ['usb'] })] }),
		});
		generateRegistrationOptions.resolves({ challenge });
	});

	it('asks for a discoverable, user-verified passkey for the user, without attestation and not on an authenticator they already use', async () => {
		await createPasskeyRegistrationOptions({ _id: 'user-id', username: 'jane', name: 'Jane Doe' });

		const [options] = generateRegistrationOptions.firstCall.args;
		expect(options).to.include({
			rpID: 'chat.example.com',
			rpName: 'Example',
			userName: 'jane',
			userDisplayName: 'Jane Doe',
			attestationType: 'none',
		});
		expect(Buffer.from(options.userID).toString('utf8')).to.equal('user-id');
		expect(options.authenticatorSelection).to.deep.equal({ residentKey: 'required', userVerification: 'required' });
		expect(options.supportedAlgorithmIDs).to.deep.equal([-8, -7, -257]);
		expect(options.excludeCredentials).to.deep.equal([{ id: 'existing', transports: ['usb'] }]);
	});

	it("stores the challenge for this user's registration only", async () => {
		await createPasskeyRegistrationOptions({ _id: 'user-id', username: 'jane' });

		expect(createChallenge.firstCall.args[0]).to.include({ challenge, purpose: 'registration', userId: 'user-id' });
	});

	it('refuses a user who already has the maximum number of passkeys', async () => {
		countByUserId.resolves(20);

		await expect(createPasskeyRegistrationOptions({ _id: 'user-id', username: 'jane' })).to.be.rejectedWith('error-passkey-limit-reached');
		expect(createChallenge.called).to.equal(false);
	});

	it('refuses while passkeys are disabled', async () => {
		assertPasskeysEnabled.throws(new ClientSafeError('error-not-allowed', 'Passkeys are disabled'));

		await expect(createPasskeyRegistrationOptions({ _id: 'user-id', username: 'jane' })).to.be.rejectedWith('error-not-allowed');
		expect(generateRegistrationOptions.called).to.equal(false);
		expect(createChallenge.called).to.equal(false);
	});
});

describe('registerPasskey', () => {
	beforeEach(() => {
		for (const stub of [
			assertPasskeysEnabled,
			countByUserId,
			insertUnlessCredentialExists,
			findOneNotExpiredForRegistrationByUserIdAndDelete,
			verifyRegistrationResponse,
		]) {
			stub.reset();
		}
		countByUserId.resolves(1);
		findOneNotExpiredForRegistrationByUserIdAndDelete.resolves({ _id: challenge });
		verifyRegistrationResponse.resolves({ verified: true, registrationInfo });
		insertUnlessCredentialExists.resolves('passkey-id');
	});

	it("consumes the user's own registration challenge and verifies the response against it, requiring user verification", async () => {
		await registerPasskey('user-id', 'Laptop', createResponse(), userAgent);

		expect(findOneNotExpiredForRegistrationByUserIdAndDelete.calledOnceWithExactly(challenge, 'user-id')).to.equal(true);
		expect(verifyRegistrationResponse.firstCall.args[0]).to.include({
			expectedChallenge: challenge,
			expectedOrigin: 'https://chat.example.com',
			expectedRPID: 'chat.example.com',
			requireUserVerification: true,
		});
	});

	it('stores the verified credential under the given name, with the device it was added from', async () => {
		const passkey = await registerPasskey('user-id', 'Laptop', createResponse(), userAgent);

		expect(passkey).to.include({
			_id: 'passkey-id',
			userId: 'user-id',
			name: 'Laptop',
			credentialId: 'Y3JlZGVudGlhbA',
			publicKey: 'AQID',
			counter: 0,
			deviceType: 'multiDevice',
			backedUp: true,
		});
		expect(passkey.transports).to.deep.equal(['internal', 'hybrid']);
		expect(passkey.authenticatorAttachment).to.equal('platform');
		expect(passkey.createdFrom).to.deep.include({ type: 'browser', name: 'Chrome' });
		expect(passkey.createdFrom?.os).to.include({ name: 'Windows' });
		expect(insertUnlessCredentialExists.firstCall.args[0]).to.not.have.property('_id');
	});

	it('never looks up a challenge that is not a string', async () => {
		await expect(
			registerPasskey('user-id', 'Laptop', createResponse({ type: 'webauthn.create', challenge: { $ne: null } }), userAgent),
		).to.be.rejectedWith('error-passkey-invalid');

		expect(findOneNotExpiredForRegistrationByUserIdAndDelete.called).to.equal(false);
		expect(insertUnlessCredentialExists.called).to.equal(false);
	});

	it('refuses a challenge that was not issued to this user, or was already answered', async () => {
		findOneNotExpiredForRegistrationByUserIdAndDelete.resolves(null);

		await expect(registerPasskey('user-id', 'Laptop', createResponse(), userAgent)).to.be.rejectedWith('error-passkey-invalid');
		expect(verifyRegistrationResponse.called).to.equal(false);
	});

	it('refuses a response the library cannot verify', async () => {
		verifyRegistrationResponse.rejects(new Error('User verification was required, but user could not be verified'));

		await expect(registerPasskey('user-id', 'Laptop', createResponse(), userAgent)).to.be.rejectedWith('error-passkey-invalid');
		expect(insertUnlessCredentialExists.called).to.equal(false);
	});

	it('refuses a response the library does not verify', async () => {
		verifyRegistrationResponse.resolves({ verified: false, registrationInfo });

		await expect(registerPasskey('user-id', 'Laptop', createResponse(), userAgent)).to.be.rejectedWith('error-passkey-invalid');
		expect(insertUnlessCredentialExists.called).to.equal(false);
	});

	it('checks the passkey limit again once the response is verified', async () => {
		countByUserId.resolves(20);

		await expect(registerPasskey('user-id', 'Laptop', createResponse(), userAgent)).to.be.rejectedWith('error-passkey-limit-reached');
		expect(insertUnlessCredentialExists.called).to.equal(false);
	});

	it('refuses a credential that is already registered to any user', async () => {
		insertUnlessCredentialExists.resolves(null);

		await expect(registerPasskey('user-id', 'Laptop', createResponse(), userAgent)).to.be.rejectedWith('error-passkey-already-registered');
	});

	it('refuses while passkeys are disabled, before consuming a challenge', async () => {
		assertPasskeysEnabled.throws(new ClientSafeError('error-not-allowed', 'Passkeys are disabled'));

		await expect(registerPasskey('user-id', 'Laptop', createResponse(), userAgent)).to.be.rejectedWith('error-not-allowed');
		expect(findOneNotExpiredForRegistrationByUserIdAndDelete.called).to.equal(false);
		expect(insertUnlessCredentialExists.called).to.equal(false);
	});
});
