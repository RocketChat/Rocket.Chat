import { API } from '/app/api/server';
import {
	AuthenticationResponseJSON,
	generateRegistrationOptions,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
	VerifiedRegistrationResponse,
	verifyRegistrationResponse,
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

class Passkey {
	private idAndChallenge = {};

	public async generateRegistrationOptions(user: IUser): Promise<{ id: string, options: PublicKeyCredentialCreationOptionsJSON }> {
		const options = await generateRegistrationOptions({
			rpName: 'WebAuthn Demo',
			rpID: 'localhost',
			userID: user.id,
			userName: user.username,
			attestationType: 'none',
			excludeCredentials: user.credentials?.map((cred) => ({
				id: cred.id,
				type: 'public-key',
				transports: cred.transports,
			})),
			authenticatorSelection: {
				residentKey: 'discouraged',
				userVerification: 'preferred',
			},
			supportedAlgorithmIDs: [-7, -257],
		});

		let id;
		do {
			id = Random.id()
		} while(this.idAndChallenge[id])
		this.idAndChallenge[id] = options.challenge

		return { id, options };
	}

	public async verifyRegistrationResponse(id: string, registrationResponse: RegistrationResponseJSON) {
			const expectedChallenge = this.idAndChallenge[id];
			delete this.idAndChallenge[id]

			let verification: VerifiedRegistrationResponse
			try {
				verification = await verifyRegistrationResponse({
					response: registrationResponse,
					expectedChallenge: expectedChallenge,
					expectedOrigin: 'http://localhost:3000',
					expectedRPID: 'localhost',
					requireUserVerification: false,
				});
			} catch (error) {
				throw new Meteor.Error("verification error", error.message);
			}

			if (!verification.verified) {
				throw new Meteor.Error("verification failed");
			}

			let credentials
			const user = await Users.findOneById(this.userId)
			if (user.credentials !== undefined)
				credentials = user.credentials
			else
				credentials = []
			const credential = verification.registrationInfo!.credential;
			const existingCredential = credentials.find((cred) => cred.id === credential.id);

			if (!existingCredential) { // TODO unnecessary? Registered devices cannot choose to register in the first place, but this judgment exists in SimpleWebAuthn's sample
				credentials.push(credential);
				await Users.updateOne({ _id: this.userId },
					{
						$set: {
							'credentials': credentials,
						},
					},
				)
			}

			return;
	}

	public async generateAuthenticationOptions(): Promise<{ id: string, options: PublicKeyCredentialRequestOptionsJSON }> {
			const options = await generateAuthenticationOptions({
				timeout: 60000,
				// allowCredentials: user.credentials.map((cred) => ({
				// 	id: cred.credentialId,
				// 	type: 'public-key',
				// 	transports: cred.transports,
				// })),
				userVerification: 'preferred',
				rpID: 'localhost',
			});

			let id;
			do {
				id = Random.id()
			} while(this.idAndChallenge[id])
			this.idAndChallenge[id] = options.challenge

			return { id, options }
	}

	public async verifyAuthenticationResponse(id: string, authenticationResponse: AuthenticationResponseJSON): Promise<string> {
			const expectedChallenge = this.idAndChallenge[id];
			delete this.idAndChallenge[id]
			const user = await Users.findOne({ credentials: { $elemMatch: { id: authenticationResponse.id } } })
			if (!user)
				throw new Meteor.Error('Authenticator is not registered with this site');
			const credential = user.credentials.find(cred => cred.id = authenticationResponse.id)
			credential.publicKey = credential.publicKey.buffer

			let verification: VerifiedAuthenticationResponse
			try {
				verification = await verifyAuthenticationResponse({
					response: authenticationResponse,
					expectedChallenge: expectedChallenge,
					expectedOrigin: 'http://localhost:3000',
					expectedRPID: 'localhost',
					credential,
					requireUserVerification: false,
				});
			} catch (error) {
				throw new Meteor.Error("verification error", error.message);
			}

			if (!verification.verified) {
				throw new Meteor.Error("verification failed");
			}

			await Users.updateOne(
				{ _id: user._id, credentials: { $elemMatch: { id: authenticationResponse.id } } },
				{
					$set: {
						'credentials.$.count': verification.authenticationInfo.newCounter,
					},
				},
			)
			return user._id;
		}
}

export const passkey = new Passkey()
