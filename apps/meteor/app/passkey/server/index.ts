import { API } from '/app/api/server';
import {
	AuthenticationResponseJSON,
	generateRegistrationOptions,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
	VerifiedRegistrationResponse,
	verifyRegistrationResponse, WebAuthnCredential,
} from '@simplewebauthn/server';
import {
	generateAuthenticationOptions,
	VerifiedAuthenticationResponse,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server/esm';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { settings } from '/app/settings/server';

// console.log(111111111111111111111111111)
// console.log(process.env.TEST_MODE);
// console.log(process.env.NODE_ENV);

const siteName: string = settings.get('Site_Name');
const siteUrl: URL = new URL(settings.get('Site_Url')); // TODO fzh075 Whether there is a problem that cannot be updated in time？
class Passkey { // TODO fzh075 Optimize by document
	private idAndChallenge = {};
	private rpName = siteName;
	private rpID = process.env.TEST_MODE === 'true' ? 'localhost' : siteUrl.hostname; // TODO fzh075 Delete the comments siteUrl.replace(/^https?:\/\//, "")
	private expectedRPID = this.rpID;
	private expectedOrigin = process.env.TEST_MODE === 'true' ? 'http://localhost:3000' : siteUrl.href.slice(0, -1); // TODO fzh075 Domain name adaptation may need to be adjusted

	public async generateRegistrationOptions(user: IUser): Promise<{
		id: string,
		options: PublicKeyCredentialCreationOptionsJSON
	}> {
		const passkeys = await Users.findPasskeysByUserId(user._id);
		const options = await generateRegistrationOptions({
			rpName: this.rpName,
			rpID: this.rpID,
			userName: user.username,
			attestationType: 'none',
			excludeCredentials: passkeys?.map((cred) => ({
				id: cred.id,
				// type: 'public-key',
				transports: cred.transports,
			})),
			authenticatorSelection: {
				residentKey: 'preferred',
				userVerification: 'preferred',

			},
			// supportedAlgorithmIDs: [-7, -257],
		});

		let id;
		do {
			id = Random.id();
		} while (this.idAndChallenge[id]);
		this.idAndChallenge[id] = options.challenge;

		return { id, options };
	}

	public async verifyRegistrationResponse(user: IUser, id: string, registrationResponse: RegistrationResponseJSON) {
		const expectedChallenge = this.idAndChallenge[id];
		delete this.idAndChallenge[id];

		let verification: VerifiedRegistrationResponse;
		try {
			verification = await verifyRegistrationResponse({
				response: registrationResponse,
				expectedChallenge: expectedChallenge,
				expectedOrigin: this.expectedOrigin,
				expectedRPID: this.expectedRPID,
				// requireUserVerification: false,
			});
		} catch (error) {
			throw new Meteor.Error('verification error', error.message);
		}

		if (!verification.verified) {
			throw new Meteor.Error('verification failed');
		}

		let passkeys = await Users.findPasskeysByUserId(user._id);
		if (passkeys === undefined)
			passkeys = [];
		const passkey = verification.registrationInfo!.credential;
		const existingCredential = passkeys.find((key) => key.id === passkey.id);

		if (!existingCredential) { // TODO fzh075 unnecessary? Registered devices cannot choose to register in the first place, but this judgment exists in SimpleWebAuthn's sample
			passkeys.push(passkey);
			await Users.setPasskeys(user._id, passkeys);
		}

		return;
	}

	public async generateAuthenticationOptions(): Promise<{
		id: string,
		options: PublicKeyCredentialRequestOptionsJSON
	}> {
		const options = await generateAuthenticationOptions({
			rpID: this.rpID,
			timeout: 60000,
			// allowCredentials: user.credentials.map((cred) => ({
			// 	id: cred.credentialId,
			// 	// type: 'public-key',
			// 	transports: cred.transports,
			// })),
			// userVerification: 'preferred',
		});

		let id;
		do {
			id = Random.id();
		} while (this.idAndChallenge[id]);
		this.idAndChallenge[id] = options.challenge;

		return { id, options };
	}

	public async verifyAuthenticationResponse(id: string, authenticationResponse: AuthenticationResponseJSON): Promise<string> {
		const expectedChallenge = this.idAndChallenge[id];
		delete this.idAndChallenge[id];
		const user = await Users.findOne({ passkeys: { $elemMatch: { id: authenticationResponse.id } } }); // TODO fzh075 Should this be included in Users.ts?
		if (!user)
			throw new Meteor.Error('Authenticator is not registered with this site');
		const passkeys = await Users.findPasskeysByUserId(user._id);
		const passkey = passkeys.find(key => key.id = authenticationResponse.id);
		passkey.publicKey = passkey.publicKey.buffer;

		let verification: VerifiedAuthenticationResponse;
		try {
			verification = await verifyAuthenticationResponse({
				response: authenticationResponse,
				expectedChallenge: expectedChallenge,
				expectedOrigin: this.expectedOrigin,
				expectedRPID: this.expectedRPID,
				credential: passkey,
				requireUserVerification: false,
			});
		} catch (error) {
			throw new Meteor.Error('verification error', error.message);
		}

		if (!verification.verified) {
			throw new Meteor.Error('verification failed');
		}

		await Users.updatePasskeyCounter(user._id, authenticationResponse.id, verification.authenticationInfo.newCounter);
		return user._id;
	}

	public async findPasskeys(userId: string): Promise<WebAuthnCredential[]> {
		return await Users.findPasskeysByUserIdForUser(userId)
	}

	public async editPasskey(userId: string, passkeyId: string, name: string) {
		console.log(passkeyId, name);
		await Users.updatePasskey(userId, passkeyId, name);
		return;
	}

	public async deletePasskey(userId: string, passkeyId: string) {
		await Users.deletePasskey(userId, passkeyId);
		return;
	}
}

export const passkey = new Passkey();
