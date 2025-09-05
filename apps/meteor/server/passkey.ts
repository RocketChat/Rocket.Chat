// import { API } from '/apps/meteor/app/api/server';
// import { Meteor } from 'meteor/meteor';
// import { Random } from 'meteor/random';
// import {
// 	AuthenticationResponseJSON,
// 	generateAuthenticationOptions,
// 	generateRegistrationOptions,
// 	PublicKeyCredentialCreationOptionsJSON,
// 	PublicKeyCredentialRequestOptionsJSON,
// 	RegistrationResponseJSON, VerifiedAuthenticationResponse,
// 	VerifiedRegistrationResponse, verifyAuthenticationResponse,
// 	verifyRegistrationResponse,
// } from '@simplewebauthn/server';
// import { Users } from '@rocket.chat/models';
//
// declare module '@rocket.chat/ddp-client' {
// 	// eslint-disable-next-line @typescript-eslint/naming-convention
// 	interface ServerMethods {
// 		'passkey:generateRegistrationOptions'(): { id: string, options: PublicKeyCredentialCreationOptionsJSON };
// 		'passkey:verifyRegistrationResponse'(id: string, registrationResponse: RegistrationResponseJSON): void;
// 		'passkey:generateAuthenticationOptions'(): { id: string, options: PublicKeyCredentialRequestOptionsJSON };
// 		'passkey:verifyAuthenticationResponse'(id: string, authenticationResponse: AuthenticationResponseJSON): void;
// 	}
// }
// import { useMethod } from '@rocket.chat/ui-contexts';
// import { A } from '@storybook/core/dist/components';
//
// const idAndChallenge = {}
//
// Meteor.methods({
// 	async 'passkey:generateRegistrationOptions'() {
// 		const user = await Users.findOneById(this.userId)
// 		const options = await generateRegistrationOptions({
// 			rpName: 'WebAuthn Demo',
// 			rpID: 'localhost',
// 			userID: user.id,
// 			userName: user.username,
// 			attestationType: 'none',
// 			excludeCredentials: user.credentials?.map((cred) => ({
// 				id: cred.id,
// 				type: 'public-key',
// 				transports: cred.transports,
// 			})),
// 			authenticatorSelection: {
// 				residentKey: 'discouraged',
// 				userVerification: 'preferred',
// 			},
// 			supportedAlgorithmIDs: [-7, -257],
// 		});
//
// 		let id;
// 		do {
// 			id = Random.id()
// 		} while(idAndChallenge[id])
// 		idAndChallenge[id] = options.challenge
//
// 		return { id, options };
// 	},
//
// 	async 'passkey:verifyRegistrationResponse'(id, registrationResponse) {
// 		const expectedChallenge = idAndChallenge[id];
// 		delete idAndChallenge[id]
//
// 		let verification: VerifiedRegistrationResponse
// 		try {
// 			verification = await verifyRegistrationResponse({
// 				response: registrationResponse,
// 				expectedChallenge: expectedChallenge,
// 				expectedOrigin: 'http://localhost:3000',
// 				expectedRPID: 'localhost',
// 				requireUserVerification: false,
// 			});
// 		} catch (error) {
// 			throw new Meteor.Error("verification error", error.message);
// 		}
//
// 		if (!verification.verified) {
// 			throw new Meteor.Error("verification failed");
// 		}
//
// 		let credentials
// 		const user = await Users.findOneById(this.userId)
// 		if (user.credentials !== undefined)
// 			credentials = user.credentials
// 		else
// 			credentials = []
// 		const credential = verification.registrationInfo!.credential;
// 		const existingCredential = credentials.find((cred) => cred.id === credential.id);
//
// 		console.log(credentials);
// 		if (!existingCredential) { // TODO unnecessary? Registered devices cannot choose to register in the first place, but this judgment exists in SimpleWebAuthn's sample
// 			credentials.push(credential);
// 			await Users.updateOne({ _id: this.userId }, {
// 					$set: {
// 						'credentials': credentials,
// 					},
// 				},
// 			)
// 		}
//
// 		return;
// 	},
//
// 	async 'passkey:generateAuthenticationOptions'() {
// 		const options = await generateAuthenticationOptions({
// 			timeout: 60000,
// 			allowCredentials: [],
// 			// allowCredentials: user.credentials.map((cred) => ({
// 			// 	id: cred.credentialId,
// 			// 	type: 'public-key',
// 			// 	transports: cred.transports,
// 			// })),
// 			userVerification: 'preferred',
// 			rpID: 'localhost',
// 		});
//
// 		let id;
// 		do {
// 			id = Random.id()
// 		} while(idAndChallenge[id])
// 		idAndChallenge[id] = options.challenge
//
// 		return { id, options }
// 	},
//
// 	async 'passkey:verifyAuthenticationResponse'(id, authenticationResponse) {
// 		const expectedChallenge = idAndChallenge[id];
// 		delete idAndChallenge[id]
// 		// user是谁?
// 		const user = await Users.findOne({ credentials: { $elemMatch: { id: authenticationResponse.id } } })
// 		if (!user)
// 			throw new Meteor.Error('Authenticator is not registered with this site');
// 		const credential = user.credentials.find(cred => cred.id = authenticationResponse.id)
// 		credential.publicKey = credential.publicKey.buffer
//
// 		let verification: VerifiedAuthenticationResponse
// 		try {
// 			verification = await verifyAuthenticationResponse({
// 				response: authenticationResponse,
// 				expectedChallenge: expectedChallenge,
// 				expectedOrigin: 'http://localhost:3000',
// 				expectedRPID: 'localhost',
// 				credential,
// 				requireUserVerification: false,
// 			});
// 		} catch (error) {
// 			throw new Meteor.Error("verification error", error.message);
// 		}
//
// 		if (!verification.verified) {
// 			throw new Meteor.Error("verification failed");
// 		}
//
// 		await Users.updateOne(
// 			{ _id: user._id, credentials: { $elemMatch: { id: authenticationResponse.id } } },
// 			{
// 				$set: {
// 					'credentials.$.count': verification.authenticationInfo.newCounter,
// 				},
// 			},
// 		)
// 		return user._id;
// 	}
// })
//
// // 	TODOX: Fix registerLoginHandler's type definitions (it accepts promises)
// //  The same problem occurs in Rocket.Chat/apps/meteor/server/configuration/cas.ts
// Accounts.registerLoginHandler("passkey", async (loginRequest) => {
// 	if (!loginRequest.id || !loginRequest.authenticationResponse) {
// 		return undefined;
// 	}
//
// 	const userId = await Meteor.callAsync('passkey:verifyAuthenticationResponse', loginRequest.id, loginRequest.authenticationResponse) // TODO error handle
// 	console.log(userId);
// 	return { userId };
// });

// const passkeyVerifyAuthenticationResponse = (id, authenticationResponse, callback) => {
// 		console.log(authenticationResponse);
// 		const expectedChallenge = idAndChallenge[id];
// 		delete idAndChallenge[id]
// 		// user是谁?
// 		const user = Users.findOne({ 'credentials.id': authenticationResponse.id }).then(() => {
// 			const credential = user.credentials?.find(cred => cred.id = authenticationResponse.id)
// 			// if (!credential)
// 			// 	throw new Meteor.Error('Authenticator is not registered with this site');
//
// 			let verification: VerifiedAuthenticationResponse
// 			try {
// 				verification = await verifyAuthenticationResponse({
// 					response: authenticationResponse,
// 					expectedChallenge: expectedChallenge,
// 					expectedOrigin: 'http://localhost:3000',
// 					expectedRPID: 'localhost',
// 					credential,
// 					requireUserVerification: false,
// 				});
// 			} catch (error) {
// 				throw new Meteor.Error("verification error", error.message);
// 			}
//
// 			if (!verification.verified) {
// 				throw new Meteor.Error("verification failed");
// 			}
//
// 			await Users.updateOne(
// 				{ _id: user.id, 'credentials.id': authenticationResponse.id },
// 				{
// 					$set: {
// 						'credentials.count': verification.authenticationInfo.newCounter,
// 					},
// 				},
// 			)
//
// 			return user.id;
// 		})
// 	}

// Accounts.registerLoginHandler("passkey", (loginRequest) => {
// 	console.log(loginRequest);
// 	if (!loginRequest.id || !loginRequest.authenticationResponse) {
// 		return undefined;
// 	}
//
// 	const userId = Meteor.wrapAsync(Meteor.call)
// 	()
// 	// Accounts._generateStampedLoginToken()
// 	return { userId };
// });

// 	'edit',
// 	'delete',


Meteor.methods({
})
// API.v1.addRoute(
// 	'users.generateRegistrationOptions',
// 	{ authRequired: true, twoFactorRequired: true },
// 	{
// 		async get() {
// 		},
// 	},
// );
//
// API.v1.addRoute(
// 	'users.verifyRegistrationResponse',
// 	{ authRequired: true, twoFactorRequired: true },
// 	{
// 		async post() {
// 		},
// 	},
// );
