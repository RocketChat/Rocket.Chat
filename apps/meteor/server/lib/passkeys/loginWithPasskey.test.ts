import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMethodConnection } from '@rocket.chat/core-typings';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const assertPasskeysEnabled = sinon.stub();
const findOneByCredentialId = sinon.stub();
const setCounterByIdAndCounter = sinon.stub();
const setLastUsedById = sinon.stub();
const findOneNotExpiredForAuthenticationAndDelete = sinon.stub();
const createChallenge = sinon.stub();
const findUserById = sinon.stub();
const verifyAuthenticationResponse = sinon.stub();
const generateAuthenticationOptions = sinon.stub();
const validateLoginAttempt = sinon.stub();
const recordFailedLoginAttempt = sinon.stub();
const issueLoginToken = sinon.stub();
const emit = sinon.stub();

const ceremony = proxyquire.noCallThru().load('./ceremony', {
	'@rocket.chat/logger': {
		Logger: class {
			warn = () => undefined;
		},
	},
	'../../settings': { settings: { get: () => undefined } },
});

const { loginWithPasskey, createPasskeyAuthenticationOptions } = proxyquire.noCallThru().load('./loginWithPasskey', {
	'@rocket.chat/models': {
		PasskeyChallenges: { createChallenge, findOneNotExpiredForAuthenticationAndDelete },
		Passkeys: { findOneByCredentialId, setCounterByIdAndCounter, setLastUsedById },
		Users: { findOneById: findUserById },
	},
	'@simplewebauthn/server': { generateAuthenticationOptions, verifyAuthenticationResponse },
	'./ceremony': {
		...ceremony,
		assertPasskeysEnabled,
		getRelyingParty: () => ({ id: 'chat.example.com', name: 'Example', origin: 'https://chat.example.com' }),
	},
	'../../services/device-management/events': { deviceManagementEvents: { emit } },
	'../auth/issueLoginToken': { issueLoginToken },
	'../auth/recordFailedLoginAttempt': { recordFailedLoginAttempt },
	'../auth/validateLoginAttempt': { validateLoginAttempt },
	'../getClientAddress': { getClientAddress: () => '10.0.0.1' },
});

const challenge = 'pS0TGBhTDmDN9w6FvQX1z6PEGXbLY0ufsWT6Gh3bO1Q';

const passkey = {
	_id: 'passkey-id',
	userId: 'user-id',
	credentialId: 'Y3JlZGVudGlhbA',
	publicKey: 'cHVibGljLWtleQ',
	counter: 3,
	transports: ['internal'],
};

const user = { _id: 'user-id', username: 'jane', active: true, roles: ['user'] };

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const connection: IMethodConnection = {
	id: 'connection-id',
	clientAddress: '10.0.0.1',
	httpHeaders: { 'user-agent': userAgent },
	close: () => undefined,
	onClose: () => undefined,
};

const createResponse = ({
	userHandle = Buffer.from('user-id').toString('base64url'),
	clientData = { type: 'webauthn.get', challenge, origin: 'https://chat.example.com' },
}: { userHandle?: string; clientData?: unknown } = {}): AuthenticationResponseJSON => ({
	id: passkey.credentialId,
	rawId: passkey.credentialId,
	type: 'public-key',
	clientExtensionResults: {},
	response: {
		clientDataJSON: Buffer.from(JSON.stringify(clientData)).toString('base64url'),
		authenticatorData: 'YQ',
		signature: 'Yg',
		...(userHandle && { userHandle }),
	},
});

describe('loginWithPasskey', () => {
	beforeEach(() => {
		for (const stub of [
			assertPasskeysEnabled,
			findOneByCredentialId,
			setCounterByIdAndCounter,
			setLastUsedById,
			findOneNotExpiredForAuthenticationAndDelete,
			createChallenge,
			findUserById,
			verifyAuthenticationResponse,
			generateAuthenticationOptions,
			validateLoginAttempt,
			recordFailedLoginAttempt,
			issueLoginToken,
			emit,
		]) {
			stub.reset();
		}

		findOneByCredentialId.resolves(passkey);
		findOneNotExpiredForAuthenticationAndDelete.resolves({ _id: challenge });
		findUserById.resolves(user);
		verifyAuthenticationResponse.resolves({ verified: true, authenticationInfo: { newCounter: 4, credentialBackedUp: true } });
		setCounterByIdAndCounter.resolves({ matchedCount: 1 });
		validateLoginAttempt.resolves(true);
		issueLoginToken.resolves('login-token');
	});

	const expectRefused = async (response = createResponse(), code = 'error-passkey-invalid') => {
		await expect(loginWithPasskey(response, connection)).to.be.rejectedWith(code);
		expect(issueLoginToken.called).to.equal(false);
		expect(setLastUsedById.called).to.equal(false);
	};

	it('signs the owner in through the login policy, as a passkey attempt, starts a session and records the device it was used from', async () => {
		expect(await loginWithPasskey(createResponse(), connection)).to.deep.equal({ userId: 'user-id', authToken: 'login-token' });

		expect(validateLoginAttempt.firstCall.args[0]).to.include({ type: 'passkey', allowed: true, user });
		expect(issueLoginToken.calledOnceWithExactly('user-id')).to.equal(true);
		expect(setCounterByIdAndCounter.calledOnceWithExactly('passkey-id', 3, { counter: 4, backedUp: true })).to.equal(true);
		expect(setLastUsedById.calledOnceWith('passkey-id')).to.equal(true);
		expect(setLastUsedById.firstCall.args[1].lastUsedFrom).to.deep.include({ type: 'browser', name: 'Chrome' });
		expect(emit.calledOnceWith('device-login', { userId: 'user-id', userAgent, clientAddress: '10.0.0.1' })).to.equal(true);
		expect(recordFailedLoginAttempt.called).to.equal(false);
	});

	it('consumes the sign-in challenge the response answers, and verifies against it, the stored key and the Site URL', async () => {
		await loginWithPasskey(createResponse(), connection);

		expect(findOneNotExpiredForAuthenticationAndDelete.calledOnceWithExactly(challenge)).to.equal(true);
		const [options] = verifyAuthenticationResponse.firstCall.args;
		expect(options).to.include({
			expectedChallenge: challenge,
			expectedOrigin: 'https://chat.example.com',
			expectedRPID: 'chat.example.com',
			requireUserVerification: true,
		});
		expect(options.credential).to.include({ id: passkey.credentialId, counter: 3 });
		expect(Buffer.from(options.credential.publicKey).toString('base64url')).to.equal(passkey.publicKey);
	});

	it('never looks up a challenge that is not a string', async () => {
		await expectRefused(createResponse({ clientData: { type: 'webauthn.get', challenge: { $ne: null } } }));

		expect(findOneNotExpiredForAuthenticationAndDelete.called).to.equal(false);
		expect(verifyAuthenticationResponse.called).to.equal(false);
	});

	it('refuses a response to a challenge that was never issued, expired or was already answered', async () => {
		findOneNotExpiredForAuthenticationAndDelete.resolves(null);

		await expectRefused();

		expect(verifyAuthenticationResponse.called).to.equal(false);
	});

	it('refuses an unknown passkey and records the failed attempt', async () => {
		findOneByCredentialId.resolves(null);

		await expectRefused();

		expect(recordFailedLoginAttempt.calledOnce).to.equal(true);
		expect(recordFailedLoginAttempt.firstCall.args[0]).to.include({ type: 'passkey', allowed: false });
		expect(recordFailedLoginAttempt.firstCall.args[0].error).to.have.property('error', 'error-passkey-invalid');
	});

	it("refuses a response without a user handle, or with one that is not the passkey owner's", async () => {
		await expectRefused(createResponse({ userHandle: '' }));
		await expectRefused(createResponse({ userHandle: Buffer.from('someone-else').toString('base64url') }));

		expect(findOneNotExpiredForAuthenticationAndDelete.called).to.equal(false);
	});

	it('refuses an assertion the library rejects, or whose signature does not verify', async () => {
		verifyAuthenticationResponse.rejects(new Error('Unexpected authentication response origin "https://evil.example"'));
		await expectRefused();

		verifyAuthenticationResponse.resolves({ verified: false, authenticationInfo: { newCounter: 4, credentialBackedUp: true } });
		await expectRefused();

		expect(setCounterByIdAndCounter.called).to.equal(false);
	});

	it('refuses the second of two sign-ins that used the same counter value', async () => {
		setCounterByIdAndCounter.resolves({ matchedCount: 0 });

		await expectRefused();

		expect(validateLoginAttempt.called).to.equal(false);
	});

	it('refuses a user the login policy refuses, with the reason the policy gave', async () => {
		validateLoginAttempt.rejects(new ClientSafeError('error-user-is-not-activated', 'User is not activated'));

		await expectRefused(createResponse(), 'error-user-is-not-activated');

		expect(recordFailedLoginAttempt.firstCall.args[0].error).to.have.property('error', 'error-user-is-not-activated');
	});

	it('refuses a passkey whose owner no longer exists', async () => {
		findUserById.resolves(null);

		await expectRefused();

		expect(validateLoginAttempt.called).to.equal(false);
	});

	it('refuses to sign in while passkeys are disabled, without counting it as a failed attempt', async () => {
		assertPasskeysEnabled.throws(new ClientSafeError('error-not-allowed', 'Passkeys are disabled'));

		await expectRefused(createResponse(), 'error-not-allowed');

		expect(findOneByCredentialId.called).to.equal(false);
		expect(recordFailedLoginAttempt.called).to.equal(false);
	});
});

describe('createPasskeyAuthenticationOptions', () => {
	beforeEach(() => {
		assertPasskeysEnabled.reset();
		createChallenge.reset();
		generateAuthenticationOptions.reset();
	});

	it('issues usernameless options that require user verification, and stores their challenge for sign-in only', async () => {
		generateAuthenticationOptions.resolves({ challenge, rpId: 'chat.example.com' });

		const issuedFrom = Date.now();
		expect(await createPasskeyAuthenticationOptions()).to.deep.equal({ challenge, rpId: 'chat.example.com' });
		const issuedUntil = Date.now();

		expect(generateAuthenticationOptions.firstCall.args[0]).to.deep.equal({
			rpID: 'chat.example.com',
			timeout: 300000,
			userVerification: 'required',
		});
		const [stored] = createChallenge.firstCall.args;
		expect(stored).to.include({ challenge, purpose: 'authentication' });
		expect(stored).to.not.have.property('userId');
		expect(stored.expireAt.getTime()).to.be.within(issuedFrom + 300000, issuedUntil + 300000);
	});

	it('refuses while passkeys are disabled, without issuing a challenge', async () => {
		assertPasskeysEnabled.throws(new ClientSafeError('error-not-allowed', 'Passkeys are disabled'));

		await expect(createPasskeyAuthenticationOptions()).to.be.rejectedWith('error-not-allowed');
		expect(generateAuthenticationOptions.called).to.equal(false);
		expect(createChallenge.called).to.equal(false);
	});
});
