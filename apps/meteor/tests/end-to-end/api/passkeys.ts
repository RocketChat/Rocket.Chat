import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { SHA256 } from '@rocket.chat/sha256';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';
import { expect } from 'chai';

import { sleep } from '../../../lib/utils/sleep';
import { api, getCredentials, request } from '../../data/api-data';
import { SoftwareAuthenticator } from '../../data/passkeys.helper';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, deleteUserIfExists, getMe, login, setUserActiveStatus } from '../../data/users.helper';

// a user without TOTP or email two-factor confirms with their password, digested like the login form digests it
const passwordFactor = { 'x-2fa-code': SHA256(password), 'x-2fa-method': 'password' };

const generateRegistrationOptions = async (userCredentials: Credentials): Promise<PublicKeyCredentialCreationOptionsJSON> => {
	const res = await request.post(api('passkeys.generateRegistrationOptions')).set(userCredentials).set(passwordFactor).expect(200);
	return res.body.options;
};

const generateAuthenticationOptions = async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
	const res = await request.post(api('passkeys.generateAuthenticationOptions')).expect(200);
	return res.body.options;
};

const registerPasskey = async (authenticator: SoftwareAuthenticator, userCredentials: Credentials, name = 'Laptop') => {
	const options = await generateRegistrationOptions(userCredentials);
	const res = await request
		.post(api('passkeys.register'))
		.set(userCredentials)
		.send({ name, credential: authenticator.createRegistrationResponse(options) })
		.expect(200);
	return res.body.passkey;
};

const loginWithPasskey = async (authenticator: SoftwareAuthenticator) =>
	request
		.post(api('passkeys.login'))
		.send({ credential: authenticator.createAuthenticationResponse(await generateAuthenticationOptions()) });

const chromeOnWindows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const expectInvalidPasskey = (res: { status: number; body: Record<string, unknown> }) => {
	expect(res.status).to.equal(400);
	expect(res.body).to.have.property('success', false);
	expect(res.body).to.have.property('errorType', 'error-passkey-invalid');
};

describe('[Passkeys]', () => {
	let origin: string;
	let user: TestUser<IUser>;
	let userCredentials: Credentials;
	let otherUser: TestUser<IUser>;
	let otherUserCredentials: Credentials;

	before((_t, done) => getCredentials(done));

	before(async () => {
		origin = new URL(String(await getSettingValueById('Site_Url'))).origin;
		await updateSetting('Accounts_Passkeys_Enabled', true);

		user = await createUser();
		userCredentials = await login(user.username, password);
		otherUser = await createUser();
		otherUserCredentials = await login(otherUser.username, password);
	});

	after(async () => {
		await updateSetting('Accounts_Passkeys_Enabled', false);
		await deleteUserIfExists(user);
		await deleteUserIfExists(otherUser);
	});

	describe('when passkeys are disabled', () => {
		before(() => updateSetting('Accounts_Passkeys_Enabled', false));
		after(() => updateSetting('Accounts_Passkeys_Enabled', true));

		it('refuses to start a registration or a sign-in', async () => {
			await request.post(api('passkeys.generateRegistrationOptions')).set(userCredentials).set(passwordFactor).expect(403);
			await request.post(api('passkeys.generateAuthenticationOptions')).expect(403);
		});

		it('refuses to sign in with a passkey registered before they were disabled', async () => {
			await updateSetting('Accounts_Passkeys_Enabled', true);
			const authenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(authenticator, userCredentials);
			const options = await generateAuthenticationOptions();
			await updateSetting('Accounts_Passkeys_Enabled', false);

			await request
				.post(api('passkeys.login'))
				.send({ credential: authenticator.createAuthenticationResponse(options) })
				.expect(403);
		});
	});

	describe('managing passkeys', () => {
		it('requires authentication', async () => {
			await request.get(api('passkeys.list')).expect(401);
			await request.post(api('passkeys.generateRegistrationOptions')).expect(401);
			await request.post(api('passkeys.register')).send({}).expect(401);
			await request.post(api('passkeys.rename')).send({ passkeyId: 'x', name: 'x' }).expect(401);
			await request.post(api('passkeys.delete')).send({ passkeyId: 'x' }).expect(401);
		});

		// a stolen session must not be enough to add a credential that outlives it
		it('asks for the password before starting a registration, even right after signing in', async () => {
			const missing = await request.post(api('passkeys.generateRegistrationOptions')).set(userCredentials);
			expect(missing.status).to.equal(400);
			expect(missing.body).to.have.property('errorType', 'totp-required');
			expect(missing.body.details).to.have.property('method', 'password');

			const wrong = await request
				.post(api('passkeys.generateRegistrationOptions'))
				.set(userCredentials)
				.set({ ...passwordFactor, 'x-2fa-code': SHA256('not the password') });
			expect(wrong.status).to.equal(400);
			expect(wrong.body).to.have.property('errorType', 'totp-invalid');

			await request.post(api('passkeys.generateRegistrationOptions')).set(userCredentials).set(passwordFactor).expect(200);
		});

		it('offers registration options for a discoverable, user-verified passkey bound to the Site URL', async () => {
			const options = await generateRegistrationOptions(userCredentials);

			expect(options.rp.id).to.equal(new URL(origin).hostname);
			expect(Buffer.from(options.user.id, 'base64url').toString('utf8')).to.equal(user._id);
			expect(options.user.name).to.equal(user.username);
			expect(options.attestation).to.equal('none');
			expect(options.authenticatorSelection).to.include({ residentKey: 'required', userVerification: 'required' });
			expect(options.pubKeyCredParams.map(({ alg }) => alg)).to.deep.equal([-8, -7, -257]);
		});

		it('registers a passkey and lists it, with the device it was added from but without its key material', async () => {
			const authenticator = new SoftwareAuthenticator(origin);
			const options = await generateRegistrationOptions(otherUserCredentials);
			const { body } = await request
				.post(api('passkeys.register'))
				.set(otherUserCredentials)
				.set('User-Agent', chromeOnWindows)
				.send({ name: '  Work laptop  ', credential: authenticator.createRegistrationResponse(options) })
				.expect(200);

			expect(body.passkey).to.include({
				name: 'Work laptop',
				deviceType: 'multiDevice',
				backedUp: true,
				authenticatorAttachment: 'platform',
			});
			expect(body.passkey).to.have.property('createdAt');

			const res = await request.get(api('passkeys.list')).set(otherUserCredentials).expect(200);
			expect(res.body.passkeys).to.have.lengthOf(1);
			const [listed] = res.body.passkeys;
			expect(listed._id).to.equal(body.passkey._id);
			expect(listed.transports).to.deep.equal(['internal', 'hybrid']);
			expect(listed.createdFrom).to.deep.include({ type: 'browser', name: 'Chrome' });
			expect(listed.createdFrom.os).to.include({ name: 'Windows' });
			expect(listed).to.not.have.any.keys('credentialId', 'publicKey', 'counter', 'aaguid', 'userId');
		});

		it("excludes the user's registered passkeys from new registration options", async () => {
			const authenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(authenticator, userCredentials);

			const options = await generateRegistrationOptions(userCredentials);
			expect(options.excludeCredentials?.map(({ id }) => id)).to.include(authenticator.credentialId);
		});

		it('refuses a registration replayed with a consumed challenge', async () => {
			const authenticator = new SoftwareAuthenticator(origin);
			const credential = authenticator.createRegistrationResponse(await generateRegistrationOptions(userCredentials));

			await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential }).expect(200);
			expectInvalidPasskey(await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential }));
		});

		it('refuses a challenge issued to another user', async () => {
			const options = await generateRegistrationOptions(otherUserCredentials);
			const credential = new SoftwareAuthenticator(origin).createRegistrationResponse(options);

			expectInvalidPasskey(await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential }));
		});

		// an object here would be a query operator matching whichever challenge the user has outstanding
		it("refuses a forged challenge that would match the user's outstanding one, which stays usable", async () => {
			const options = await generateRegistrationOptions(userCredentials);

			for (const challenge of [{ $ne: null }, { $exists: true }, { $regex: '.*' }]) {
				const forged = new SoftwareAuthenticator(origin).createRegistrationResponse(options, { challenge });
				expectInvalidPasskey(
					await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Forged', credential: forged }),
				);
			}

			const credential = new SoftwareAuthenticator(origin).createRegistrationResponse(options);
			await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential }).expect(200);
		});

		it('refuses a passkey created on another origin, or in a cross-origin frame', async () => {
			const options = await generateRegistrationOptions(userCredentials);
			const otherOrigin = new SoftwareAuthenticator('https://phishing.example').createRegistrationResponse(options);
			expectInvalidPasskey(
				await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential: otherOrigin }),
			);

			const framed = new SoftwareAuthenticator(origin).createRegistrationResponse(await generateRegistrationOptions(userCredentials), {
				crossOrigin: true,
			});
			expectInvalidPasskey(await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential: framed }));
		});

		it('refuses a passkey created for another relying party', async () => {
			const options = await generateRegistrationOptions(userCredentials);
			const credential = new SoftwareAuthenticator(origin).createRegistrationResponse(options, { rpId: 'phishing.example' });

			expectInvalidPasskey(await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential }));
		});

		it('refuses a passkey that did not verify the user', async () => {
			const options = await generateRegistrationOptions(userCredentials);
			const credential = new SoftwareAuthenticator(origin).createRegistrationResponse(options, { userVerified: false });

			expectInvalidPasskey(await request.post(api('passkeys.register')).set(userCredentials).send({ name: 'Phone', credential }));
		});

		it('refuses a credential that is already registered', async () => {
			const authenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(authenticator, userCredentials);

			const credential = authenticator.createRegistrationResponse(await generateRegistrationOptions(otherUserCredentials));
			const res = await request.post(api('passkeys.register')).set(otherUserCredentials).send({ name: 'Phone', credential });
			expect(res.status).to.equal(400);
			expect(res.body).to.have.property('errorType', 'error-passkey-already-registered');
		});

		it('rejects malformed requests', async () => {
			const credential = new SoftwareAuthenticator(origin).createRegistrationResponse(await generateRegistrationOptions(userCredentials));

			await request.post(api('passkeys.register')).set(userCredentials).send({ name: ' ', credential }).expect(400);
			await request
				.post(api('passkeys.register'))
				.set(userCredentials)
				.send({ name: 'x'.repeat(65), credential })
				.expect(400);
			await request
				.post(api('passkeys.register'))
				.set(userCredentials)
				.send({ name: 'Phone', credential: { ...credential, id: 'not base64url!' } })
				.expect(400);
			await request
				.post(api('passkeys.register'))
				.set(userCredentials)
				.send({ name: 'Phone', credential: { ...credential, extra: true } })
				.expect(400);
		});

		it("renames only the user's own passkeys", async () => {
			const passkey = await registerPasskey(new SoftwareAuthenticator(origin), userCredentials);

			await request.post(api('passkeys.rename')).set(otherUserCredentials).send({ passkeyId: passkey._id, name: 'Stolen' }).expect(404);
			await request.post(api('passkeys.rename')).set(userCredentials).send({ passkeyId: passkey._id, name: 'Desktop' }).expect(200);

			const res = await request.get(api('passkeys.list')).set(userCredentials).expect(200);
			expect(res.body.passkeys.find(({ _id }: { _id: string }) => _id === passkey._id)).to.have.property('name', 'Desktop');
		});

		it("deletes only the user's own passkeys, which then stop signing in", async () => {
			const authenticator = new SoftwareAuthenticator(origin);
			const passkey = await registerPasskey(authenticator, userCredentials);

			await request.post(api('passkeys.delete')).set(otherUserCredentials).send({ passkeyId: passkey._id }).expect(404);
			await request.post(api('passkeys.delete')).set(userCredentials).send({ passkeyId: passkey._id }).expect(200);
			await request.post(api('passkeys.delete')).set(userCredentials).send({ passkeyId: passkey._id }).expect(404);

			expectInvalidPasskey(await loginWithPasskey(authenticator));
		});
	});

	describe('signing in', () => {
		let authenticator: SoftwareAuthenticator;

		before(async () => {
			authenticator = new SoftwareAuthenticator(origin, 0, false);
			await registerPasskey(authenticator, userCredentials, 'Security key');
		});

		it('offers usernameless options that require user verification', async () => {
			const options = await generateAuthenticationOptions();

			expect(options.rpId).to.equal(new URL(origin).hostname);
			expect(options.userVerification).to.equal('required');
			expect(options.allowCredentials ?? []).to.have.lengthOf(0);
		});

		it('signs the user in with a token that authenticates the REST API', async () => {
			const res = await loginWithPasskey(authenticator);

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property('userId', user._id);
			expect(res.body).to.have.property('authToken').that.is.a('string');

			const me = await getMe({ 'X-User-Id': res.body.userId, 'X-Auth-Token': res.body.authToken });
			expect(me).to.have.property('_id', user._id);
		});

		it('records when, and from which device, the passkey was last used', async () => {
			await request
				.post(api('passkeys.login'))
				.set('User-Agent', chromeOnWindows)
				.send({ credential: authenticator.createAuthenticationResponse(await generateAuthenticationOptions()) })
				.expect(200);

			const res = await request.get(api('passkeys.list')).set(userCredentials).expect(200);
			const passkey = res.body.passkeys.find(({ name }: { name: string }) => name === 'Security key');

			expect(passkey).to.have.property('lastUsedAt');
			expect(passkey.lastUsedFrom).to.deep.include({ type: 'browser', name: 'Chrome' });
		});

		it('refuses an assertion replayed with a consumed challenge', async () => {
			const credential = authenticator.createAuthenticationResponse(await generateAuthenticationOptions());

			await request.post(api('passkeys.login')).send({ credential }).expect(200);
			expectInvalidPasskey(await request.post(api('passkeys.login')).send({ credential }));
		});

		it('refuses an assertion for a challenge that was never issued', async () => {
			const options = await generateAuthenticationOptions();
			const credential = authenticator.createAuthenticationResponse(options, {
				challenge: Buffer.from('forged-challenge').toString('base64url'),
			});

			expectInvalidPasskey(await request.post(api('passkeys.login')).send({ credential }));
		});

		// an object here would be a query operator consuming whichever challenge another visitor is answering
		it("refuses a forged challenge that would match another visitor's, which stays usable", async () => {
			const options = await generateAuthenticationOptions();

			for (const challenge of [{ $ne: null }, { $gt: '' }, { $regex: '.*' }]) {
				const forged = authenticator.createAuthenticationResponse(options, { challenge });
				expectInvalidPasskey(await request.post(api('passkeys.login')).send({ credential: forged }));
			}

			await request
				.post(api('passkeys.login'))
				.send({ credential: authenticator.createAuthenticationResponse(options) })
				.expect(200);
		});

		it('refuses an assertion signed by another key', async () => {
			const impostor = new SoftwareAuthenticator(origin, 1000);
			const credential = impostor.createAuthenticationResponse(await generateAuthenticationOptions(), {
				userHandle: Buffer.from(user._id).toString('base64url'),
			});

			expectInvalidPasskey(
				await request
					.post(api('passkeys.login'))
					.send({ credential: { ...credential, id: authenticator.credentialId, rawId: authenticator.credentialId } }),
			);
		});

		it('refuses an assertion made on another origin, or in a cross-origin frame', async () => {
			expectInvalidPasskey(
				await request.post(api('passkeys.login')).send({
					credential: authenticator.createAuthenticationResponse(await generateAuthenticationOptions(), {
						origin: 'https://phishing.example',
					}),
				}),
			);
			expectInvalidPasskey(
				await request.post(api('passkeys.login')).send({
					credential: authenticator.createAuthenticationResponse(await generateAuthenticationOptions(), { crossOrigin: true }),
				}),
			);
		});

		it('refuses an assertion that did not verify the user', async () => {
			const credential = authenticator.createAuthenticationResponse(await generateAuthenticationOptions(), { userVerified: false });

			expectInvalidPasskey(await request.post(api('passkeys.login')).send({ credential }));
		});

		it('refuses an assertion naming another user, or no user', async () => {
			const otherHandle = authenticator.createAuthenticationResponse(await generateAuthenticationOptions(), {
				userHandle: Buffer.from(otherUser._id).toString('base64url'),
			});
			expectInvalidPasskey(await request.post(api('passkeys.login')).send({ credential: otherHandle }));

			const noHandle = authenticator.createAuthenticationResponse(await generateAuthenticationOptions(), { userHandle: null });
			await request.post(api('passkeys.login')).send({ credential: noHandle }).expect(400);
		});

		it('refuses an authenticator whose signature counter went backwards, as a cloned one would', async () => {
			authenticator.rewindSignCount(1);

			expectInvalidPasskey(await loginWithPasskey(authenticator));
		});

		it('refuses an unknown passkey', async () => {
			expectInvalidPasskey(await loginWithPasskey(new SoftwareAuthenticator(origin)));
		});

		it('refuses a deactivated user', async () => {
			const deactivated = await createUser();
			const deactivatedAuthenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(deactivatedAuthenticator, await login(deactivated.username, password));
			await setUserActiveStatus(deactivated._id, false);

			try {
				const res = await loginWithPasskey(deactivatedAuthenticator);
				expect(res.status).to.equal(400);
				expect(res.body).to.have.property('errorType', 'error-user-is-not-activated');
			} finally {
				await deleteUser(deactivated);
			}
		});

		it('refuses a user without a verified email while email verification is required, as a password login does', async () => {
			const unverified = await createUser();
			const unverifiedAuthenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(unverifiedAuthenticator, await login(unverified.username, password));
			await updateSetting('Accounts_EmailVerification', true);

			try {
				const res = await loginWithPasskey(unverifiedAuthenticator);
				expect(res.status).to.equal(400);
				expect(res.body).to.have.property('errorType', 'error-invalid-email');
			} finally {
				await updateSetting('Accounts_EmailVerification', false);
				await deleteUser(unverified);
			}
		});

		it('removes the passkeys of a deleted user', async () => {
			const deleted = await createUser();
			const deletedAuthenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(deletedAuthenticator, await login(deleted.username, password));
			await deleteUser(deleted);

			expectInvalidPasskey(await loginWithPasskey(deletedAuthenticator));
		});
	});

	describe('when an address is blocked after failed sign-ins', () => {
		const maxAttemptsByIp = 3;
		const ipBlockSeconds = 3;
		let authenticator: SoftwareAuthenticator;

		before(async () => {
			authenticator = new SoftwareAuthenticator(origin);
			await registerPasskey(authenticator, userCredentials);

			await Promise.all([
				updateSetting('Block_Multiple_Failed_Logins_Enabled', true),
				updateSetting('Block_Multiple_Failed_Logins_By_Ip', true),
				updateSetting('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', maxAttemptsByIp),
				updateSetting('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', ipBlockSeconds / 60),
			]);
		});

		after(async () => {
			await sleep(ipBlockSeconds * 1000);
			await Promise.all([
				updateSetting('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 50),
				updateSetting('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 5),
			]);
		});

		it('counts failed passkey sign-ins and refuses valid ones until the block expires', async () => {
			for (let attempt = 0; attempt < maxAttemptsByIp; attempt++) {
				expectInvalidPasskey(await loginWithPasskey(new SoftwareAuthenticator(origin)));
			}

			const blocked = await loginWithPasskey(authenticator);
			expect(blocked.status).to.equal(400);
			expect(blocked.body).to.have.property('errorType', 'error-login-blocked-for-ip');

			await sleep(ipBlockSeconds * 1000);

			await loginWithPasskey(authenticator).then((res) => expect(res.status).to.equal(200));
		});
	});

	describe('limits', () => {
		it('refuses to register more than 20 passkeys per user', async () => {
			const limited = await createUser();
			const limitedCredentials = await login(limited.username, password);

			try {
				for (let registered = 0; registered < 20; registered++) {
					await registerPasskey(new SoftwareAuthenticator(origin), limitedCredentials);
				}

				const res = await request.post(api('passkeys.generateRegistrationOptions')).set(limitedCredentials).set(passwordFactor);
				expect(res.status).to.equal(400);
				expect(res.body).to.have.property('errorType', 'error-passkey-limit-reached');
			} finally {
				await deleteUser(limited);
			}
		});
	});
});
