import { isClientSafeError } from '@rocket.chat/core-services';
import type { IMethodConnection, IPasskey, IUser } from '@rocket.chat/core-typings';
import { PasskeyChallenges, Passkeys, Users } from '@rocket.chat/models';
import { getHeader } from '@rocket.chat/tools';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';

import {
	CEREMONY_TIMEOUT_MS,
	assertPasskeysEnabled,
	getChallengeExpiry,
	getRelyingParty,
	getResponseChallenge,
	refusePasskey,
} from './ceremony';
import { deviceManagementEvents } from '../../services/device-management/events';
import type { ILoginAttempt } from '../auth/ILoginAttempt';
import { issueLoginToken } from '../auth/issueLoginToken';
import { recordFailedLoginAttempt } from '../auth/recordFailedLoginAttempt';
import { validateLoginAttempt } from '../auth/validateLoginAttempt';
import { getClientAddress } from '../getClientAddress';
import { getSessionDevice } from '../statistics/lib/getSessionDevice';

export type PasskeyRequestOptions = Omit<PublicKeyCredentialRequestOptionsJSON, 'extensions'>;

export const createPasskeyAuthenticationOptions = async (): Promise<PasskeyRequestOptions> => {
	assertPasskeysEnabled();

	const options = await generateAuthenticationOptions({
		rpID: getRelyingParty().id,
		timeout: CEREMONY_TIMEOUT_MS,
		userVerification: 'required',
	});

	await PasskeyChallenges.createChallenge({ challenge: options.challenge, purpose: 'authentication', expireAt: getChallengeExpiry() });

	return options;
};

const verifyPasskey = async (response: AuthenticationResponseJSON): Promise<IPasskey> => {
	const passkey = await Passkeys.findOneByCredentialId(response.id);
	if (!passkey) {
		throw refusePasskey('no passkey has this credential id');
	}

	const passkeyId = passkey._id;
	const { userHandle } = response.response;
	if (!userHandle || Buffer.from(userHandle, 'base64url').toString('utf8') !== passkey.userId) {
		throw refusePasskey('the user handle does not name the owner of the passkey', { passkeyId });
	}

	const challenge = getResponseChallenge(response.response.clientDataJSON);
	if (!(await PasskeyChallenges.findOneNotExpiredForAuthenticationAndDelete(challenge))) {
		throw refusePasskey('the sign-in answers an unknown, expired or used challenge', { passkeyId });
	}

	const relyingParty = getRelyingParty();
	const { verified, authenticationInfo } = await verifyAuthenticationResponse({
		response,
		expectedChallenge: challenge,
		expectedOrigin: relyingParty.origin,
		expectedRPID: relyingParty.id,
		credential: {
			id: passkey.credentialId,
			publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64url')),
			counter: passkey.counter,
			transports: passkey.transports,
		},
		requireUserVerification: true,
	}).catch((error) => {
		throw refusePasskey('the sign-in could not be verified', { passkeyId, err: error });
	});

	if (!verified) {
		throw refusePasskey('the signature does not verify', { passkeyId });
	}

	const { matchedCount } = await Passkeys.setCounterByIdAndCounter(passkeyId, passkey.counter, {
		counter: authenticationInfo.newCounter,
		backedUp: authenticationInfo.credentialBackedUp,
	});
	if (!matchedCount) {
		throw refusePasskey('the passkey was used by another sign-in at the same time', { passkeyId });
	}

	return passkey;
};

const authorizeLogin = async (
	response: AuthenticationResponseJSON,
	attempt: ILoginAttempt,
): Promise<{ user: IUser; passkey: IPasskey }> => {
	const passkey = await verifyPasskey(response);
	const user = await Users.findOneById(passkey.userId);
	if (!user) {
		throw refusePasskey('the owner of the passkey no longer exists', { passkeyId: passkey._id });
	}

	attempt.user = user;
	attempt.allowed = true;
	if (!(await validateLoginAttempt(attempt))) {
		throw refusePasskey('the login policy refused the owner of the passkey', { passkeyId: passkey._id });
	}

	return { user, passkey };
};

/** Signs in the owner of the passkey that produced `response`, under the same login policy as the other login methods. */
export const loginWithPasskey = async (
	response: AuthenticationResponseJSON,
	connection: IMethodConnection,
): Promise<{ userId: IUser['_id']; authToken: string }> => {
	assertPasskeysEnabled();

	const attempt: ILoginAttempt = {
		type: 'passkey',
		allowed: false,
		methodName: 'passkeys.login',
		methodArguments: [{}],
		connection,
	};

	const { user, passkey } = await authorizeLogin(response, attempt).catch(async (error) => {
		attempt.allowed = false;
		attempt.error = isClientSafeError(error) ? error : undefined;
		await recordFailedLoginAttempt(attempt);
		throw error;
	});

	const userAgent = getHeader(connection.httpHeaders, 'user-agent');
	const authToken = await issueLoginToken(user._id);
	await Passkeys.setLastUsedById(passkey._id, { lastUsedAt: new Date(), ...(userAgent && { lastUsedFrom: getSessionDevice(userAgent) }) });

	deviceManagementEvents.emit('device-login', { userId: user._id, userAgent, clientAddress: getClientAddress(connection) });

	return { userId: user._id, authToken };
};
