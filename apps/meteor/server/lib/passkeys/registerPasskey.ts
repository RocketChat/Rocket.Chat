import { ClientSafeError } from '@rocket.chat/core-services';
import type { IPasskey, IUser } from '@rocket.chat/core-typings';
import { PasskeyChallenges, Passkeys } from '@rocket.chat/models';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/server';

import {
	CEREMONY_TIMEOUT_MS,
	SUPPORTED_ALGORITHM_IDS,
	assertPasskeysEnabled,
	getChallengeExpiry,
	getRelyingParty,
	getResponseChallenge,
	refusePasskey,
} from './ceremony';
import { getSessionDevice } from '../statistics/lib/getSessionDevice';

const MAX_PASSKEYS_PER_USER = 20;

export type PasskeyCreationOptions = Omit<PublicKeyCredentialCreationOptionsJSON, 'extensions'> & { extensions?: { credProps?: boolean } };

const assertBelowPasskeyLimit = async (userId: IUser['_id']): Promise<void> => {
	if ((await Passkeys.countByUserId(userId)) >= MAX_PASSKEYS_PER_USER) {
		throw new ClientSafeError('error-passkey-limit-reached', 'You have reached the maximum number of passkeys', {
			limit: MAX_PASSKEYS_PER_USER,
		});
	}
};

export const createPasskeyRegistrationOptions = async (
	user: Pick<IUser, '_id' | 'name'> & Required<Pick<IUser, 'username'>>,
): Promise<PasskeyCreationOptions> => {
	assertPasskeysEnabled();
	await assertBelowPasskeyLimit(user._id);

	const relyingParty = getRelyingParty();
	const excludeCredentials = await Passkeys.findByUserId(user._id, { projection: { credentialId: 1, transports: 1 } })
		.map(({ credentialId, transports }) => ({ id: credentialId, transports }))
		.toArray();

	const options = await generateRegistrationOptions({
		rpID: relyingParty.id,
		rpName: relyingParty.name,
		userID: new TextEncoder().encode(user._id),
		userName: user.username,
		userDisplayName: user.name || user.username,
		timeout: CEREMONY_TIMEOUT_MS,
		attestationType: 'none',
		excludeCredentials,
		authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
		supportedAlgorithmIDs: SUPPORTED_ALGORITHM_IDS,
	});

	await PasskeyChallenges.createChallenge({
		challenge: options.challenge,
		purpose: 'registration',
		userId: user._id,
		expireAt: getChallengeExpiry(),
	});

	return options;
};

export const registerPasskey = async (
	userId: IUser['_id'],
	name: IPasskey['name'],
	response: RegistrationResponseJSON,
	userAgent: string,
): Promise<Omit<IPasskey, '_updatedAt'>> => {
	assertPasskeysEnabled();

	const challenge = getResponseChallenge(response.response.clientDataJSON);
	if (!(await PasskeyChallenges.findOneNotExpiredForRegistrationByUserIdAndDelete(challenge, userId))) {
		throw refusePasskey('the registration answers an unknown, expired or used challenge', { userId });
	}

	const relyingParty = getRelyingParty();
	const verification = await verifyRegistrationResponse({
		response,
		expectedChallenge: challenge,
		expectedOrigin: relyingParty.origin,
		expectedRPID: relyingParty.id,
		requireUserVerification: true,
		supportedAlgorithmIDs: SUPPORTED_ALGORITHM_IDS,
	}).catch((error) => {
		throw refusePasskey('the registration could not be verified', { userId, err: error });
	});

	if (!verification.verified) {
		throw refusePasskey('the registration could not be verified', { userId });
	}

	await assertBelowPasskeyLimit(userId);

	const { credential, aaguid, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
	const passkey: Omit<IPasskey, '_id' | '_updatedAt'> = {
		userId,
		name,
		credentialId: credential.id,
		publicKey: Buffer.from(credential.publicKey).toString('base64url'),
		counter: credential.counter,
		...(credential.transports && { transports: credential.transports }),
		...(response.authenticatorAttachment && { authenticatorAttachment: response.authenticatorAttachment }),
		aaguid,
		deviceType: credentialDeviceType,
		backedUp: credentialBackedUp,
		createdAt: new Date(),
		...(userAgent && { createdFrom: getSessionDevice(userAgent) }),
	};

	const passkeyId = await Passkeys.insertUnlessCredentialExists(passkey);
	if (!passkeyId) {
		throw new ClientSafeError('error-passkey-already-registered', 'This passkey is already registered');
	}

	return { ...passkey, _id: passkeyId };
};
