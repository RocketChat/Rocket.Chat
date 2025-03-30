import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { API } from '../api';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/typescript-types';

interface RegisterOptionsRequest {
    username?: string; 
}
interface RegisterOptionsResponse {
    options: any; 
}
interface RegisterVerifyRequest {
    attestationResponse: any; 
    username: string;
}
interface RegisterVerifyResponse {
    success: boolean;
    passkeyId?: string;
}
interface LoginVerifyRequest {
    username: string;
    authenticationResponse: any;
}
interface LoginVerifyResponse {
    userId: string;
    success: boolean;
    error?: string;
    authToken?: string;
}
interface Passkey {
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: AuthenticatorTransportFuture[];  
    name: string;
    createdAt: Date;   
    id: string;
    algorithm?: string; 
}
interface RemovePasskeyRequest {
    username: string;
    passkeyId: string;
}
interface RemovePasskeyResponse {
    success: boolean;
    message?: string;
}

// Passkey registration endpoint
API.v1.addRoute(
    '/passkey/registerOptions',
    { authRequired: false },
    {
        async post(this: { bodyParams: RegisterOptionsRequest }) {
            const { username } = this.bodyParams;
            if (!username?.trim()) {
                throw new Meteor.Error('error-username-param-not-provided', 'Username is required.');
            }
            const user = await Users.findOne({ username });
            if (!user) {
                throw new Meteor.Error('error-user-not-found', 'User not found.');
            }
            if (!user._id) {
                throw new Meteor.Error('error-user-id-not-found', 'User ID not found.');
            }
            const userID = new TextEncoder().encode(user._id);
            const options = await generateRegistrationOptions({
                rpName: 'Rocket.Chat',
                rpID: Meteor.settings.public?.ROOT_URL?.replace(/^https?:\/\//, '') || 'localhost',
                userID: userID,
                userName: username,
                timeout: 60000,
                attestationType: 'none',
            });
            await Users.updateOne(
                { _id: user._id },
                { $set: { 'services.passkeyChallenge': options.challenge } },
            );
            return API.v1.success<RegisterOptionsResponse>({ options });
        },
    },
);

// Passkey verification endpoint
API.v1.addRoute(
    '/passkey/registerVerify',
    { authRequired: false },
    {
        async post(this: { bodyParams: RegisterVerifyRequest }) {
            const { attestationResponse, username } = this.bodyParams;
            if (!attestationResponse || !username?.trim()) {
                throw new Meteor.Error('error-invalid-params', 'Attestation response and username are required.');
            }
            const user = await Users.findOne({ username });
            if (!user) {
                throw new Meteor.Error('error-user-not-found', 'User not found.');
            }
            const expectedChallenge = user.services?.passkeyChallenge;
            if (!expectedChallenge) {
                throw new Meteor.Error('error-challenge-not-found', 'Challenge not found for the user.');
            }
            const verification = await verifyRegistrationResponse({
                response: attestationResponse,
                expectedChallenge,
                expectedOrigin: Meteor.settings.public?.ROOT_URL || 'http://localhost:3000',
                expectedRPID: Meteor.settings.public?.ROOT_URL?.replace(/^https?:\/\//, '') || 'localhost',
            });
            if (verification.verified) {
                if (!verification.registrationInfo) {
                    throw new Meteor.Error('error-registration-info-missing', 'Registration information missing from verification response.');
                }
                
                const publicKeyUint8Array = verification.registrationInfo.credential.publicKey;
                const publicKeyBase64 = Buffer.from(publicKeyUint8Array).toString('base64');
                const passkey: Passkey = {
                    id: attestationResponse.id,
                    name: 'Device Name',
                    credentialId: attestationResponse.rawId,
                    publicKey: publicKeyBase64,                    
                    counter: attestationResponse.response.counter || 0,
                    transports: attestationResponse.response.transports || [],
                    algorithm: attestationResponse.response.algorithm || 'ES256',
                    createdAt: new Date(),
                };
                await Users.updateOne(
                    { _id: user._id },
                    { $push: { 'services.passkeys': passkey }, $unset: { 'services.passkeyChallenge': 1 } },
                );
                return API.v1.success<RegisterVerifyResponse>({ success: true, passkeyId: passkey.id });
            } else {
                return API.v1.failure('Verification failed.');
            }
        },
    },
);

API.v1.addRoute(
    '/passkey/remove',
    { authRequired: true },
    {
        async post(this: { bodyParams: RemovePasskeyRequest }) {
            const { username, passkeyId } = this.bodyParams;
            if (!username?.trim() || !passkeyId?.trim()) {
                throw new Meteor.Error('error-invalid-params', 'Username and passkey ID are required.');
            }
            const user = await Users.findOne({ username });
            if (!user) {
                throw new Meteor.Error('error-user-not-found', 'User not found.');
            }
            if (!user.services?.passkeys) {
                return API.v1.failure('No passkeys found for this user.');
            }
            const updatedPasskeys = user.services.passkeys.filter((passkey: Passkey) => passkey.id !== passkeyId);
            if (updatedPasskeys.length === user.services.passkeys.length) {
                return API.v1.failure('Passkey not found.');
            }
            await Users.updateOne(
                { _id: user._id },
                { $set: { 'services.passkeys': updatedPasskeys } },
            );
            return API.v1.success<RemovePasskeyResponse>({ success: true, message: 'Passkey removed successfully.' });
        },
    },
);

API.v1.addRoute(
    '/users/me',
    { authRequired: true },
    {
        async get(this: { bodyParams: RegisterOptionsRequest }) {
            const { username } = this.bodyParams;
            const user = await Users.findOne({ username });
            const userSecond = await Users.findOne({ _id: user?._id });
            if (!userSecond) {
                return API.v1.failure('User not found.');
            }
            return API.v1.success({ userSecond });
        },
    },
);

// Passkey authentication endpoint
API.v1.addRoute(
    '/passkey/loginOptions',
    { authRequired: false },
    {
      async get(this: { queryParams: { username: string } }) {
        const { username } = this.queryParams;
        console.log('[/passkey/loginOptions] Received username:', username);
        if (!username?.trim()) {
          throw new Meteor.Error('error-username-param-not-provided', 'Username is required.');
        }
  
        const cleanUsername = username.includes('@') ? username.split('@')[0] : username;
        console.log('[/passkey/loginOptions] Cleaned username:', cleanUsername);
        const user = await Users.findOne({ username: cleanUsername });
        if (!user) {
          throw new Meteor.Error('error-user-not-found', 'User not found.');
        }
        console.log('[/passkey/loginOptions] User found:', !!user);
        if (!user.services?.passkeys || user.services.passkeys.length === 0) {
          return API.v1.success({ options: null });
        }
  
        const allowCredentials = user.services.passkeys.map((passkey: Passkey) => ({
            id: passkey.credentialId, 
            type: 'public-key',
            transports: passkey.transports || [],
        }));          
        console.log('[/passkey/loginOptions] allowCredentials:', allowCredentials);
        let rpID = 'localhost';
  
        const options = await generateAuthenticationOptions({
            rpID: rpID,
            allowCredentials,
            userVerification: 'preferred',
            timeout: 60000,
        });
        console.log('[/passkey/loginOptions] generateAuthenticationOptions result:', options);
  
        await Users.updateOne(
          { _id: user._id },
          { $set: { 'services.passkeyAuthenticationChallenge': options.challenge } },
        );
        console.log('[/passkey/loginOptions] Challenge saved.');
        return API.v1.success({ options });
      },
    },
);

// Passkey authentication verification endpoint
API.v1.addRoute(
    '/passkey/loginVerify',
    { authRequired: false },
    {
        async post(this: { bodyParams: LoginVerifyRequest }) {
            const { username, authenticationResponse } = this.bodyParams;
            if (!username?.trim() || !authenticationResponse) {
                throw new Meteor.Error('error-invalid-params', 'Username and authentication response are required.');
            }

            const user = await Users.findOne({ username });
            if (!user) {
                throw new Meteor.Error('error-user-not-found', 'User not found.');
            }

            const expectedChallenge = user.services?.passkeyAuthenticationChallenge;
            if (!expectedChallenge) {
                throw new Meteor.Error('error-challenge-not-found', 'Challenge not found for the user.');
            }

            const passkey = user.services?.passkeys?.find((pk: Passkey) =>
                pk.credentialId === authenticationResponse.rawId 
            );

            if (!passkey) {
                return API.v1.failure('Could not find passkey for this credential ID.');
            }

            try {
                const publicKeyUint8Array = new Uint8Array(Buffer.from(passkey.publicKey, 'base64'));
                console.log("public key bytes", publicKeyUint8Array);
                const verification = await verifyAuthenticationResponse({
                    response: authenticationResponse,
                    expectedChallenge,
                    expectedOrigin: Meteor.settings.public?.ROOT_URL || 'http://localhost:3000',
                    expectedRPID: 'localhost',
                    credential: {
                        id: passkey.credentialId, 
                        publicKey: publicKeyUint8Array,
                        counter: passkey.counter,
                        transports: passkey.transports,
                    },
                    requireUserVerification: true,
                });
                console.log("Verification result", verification);
            
                if (verification.verified && verification.authenticationInfo) {
                    await Users.updateOne(
                        { _id: user._id, 'services.passkeys.credentialId': passkey.credentialId },
                        { $set: { 'services.passkeys.$.counter': verification.authenticationInfo.newCounter } },
                    );

                    const stampedToken = Accounts._generateStampedLoginToken();
                    await Users.updateOne(
                        { _id: user._id },
                        { $push: { 'services.resume.loginTokens': stampedToken } },
                    );

                    return API.v1.success<LoginVerifyResponse>({
                        success: true,
                        userId: user._id,
                        authToken: stampedToken.token,
                    });
                }
                return API.v1.failure('Passkey verification failed.');
            } catch (error: any) {
                console.error('Passkey verification error:', error);
                return API.v1.failure(`Passkey verification failed: ${error.message}`);
            } finally {
                await Users.updateOne(
                    { _id: user._id },
                    { $unset: { 'services.passkeyAuthenticationChallenge': 1 } },
                );
            }
        },
    },
);