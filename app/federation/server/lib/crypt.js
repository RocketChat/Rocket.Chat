import { FederationKeys } from '../../../models/server';
import { getFederationDomain } from './getFederationDomain';
import { search } from './dns';
import { logger } from './logger';

export function decrypt(data, peerKey) {
	//
	// Decrypt the payload
	const payloadBuffer = Buffer.from(data);

	// Decrypt with the peer's public key
	try {
		data = FederationKeys.loadKey(peerKey, 'public').decryptPublic(payloadBuffer);

		// Decrypt with the local private key
		data = FederationKeys.getPrivateKey().decrypt(data);
	} catch (err) {
		logger.crypt.error(err);

		throw new Error('Could not decrypt');
	}

	return JSON.parse(data.toString());
}

export function decryptIfNeeded(request, bodyParams) {
	//
	// Look for the domain that sent this event
	const remotePeerDomain = request.headers['x-federation-domain'];

	if (!remotePeerDomain) {
		throw new Error('Domain is unknown, ignoring event');
	}

	//
	// Decrypt payload if needed
	if (remotePeerDomain === getFederationDomain()) {
		return bodyParams;
	}
	//
	// Find the peer's public key
	const { publicKey: peerKey } = search(remotePeerDomain);

	if (!peerKey) {
		throw new Error("Could not find the peer's public key to decrypt");
	}

	return decrypt(bodyParams, peerKey);
}

export function encrypt(data, peerKey) {
	if (!data) {
		return data;
	}

	try {
		// Encrypt with the peer's public key
		data = FederationKeys.loadKey(peerKey, 'public').encrypt(data);

		// Encrypt with the local private key
		return FederationKeys.getPrivateKey().encryptPrivate(data);
	} catch (err) {
		logger.crypt.error(err);

		throw new Error('Could not encrypt');
	}
}
