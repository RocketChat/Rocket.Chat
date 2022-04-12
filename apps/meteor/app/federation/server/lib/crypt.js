import { FederationKeys } from '../../../models/server/raw';
import { getFederationDomain } from './getFederationDomain';
import { search } from './dns';
import { cryptLogger } from './logger';

export async function decrypt(data, peerKey) {
	//
	// Decrypt the payload
	const payloadBuffer = Buffer.from(data);

	// Decrypt with the peer's public key
	try {
		data = (await FederationKeys.loadKey(peerKey, 'public')).decryptPublic(payloadBuffer);

		// Decrypt with the local private key
		data = (await FederationKeys.getPrivateKey()).decrypt(data);
	} catch (err) {
		cryptLogger.error(err);

		throw new Error('Could not decrypt');
	}

	return JSON.parse(data.toString());
}

export async function decryptIfNeeded(request, bodyParams) {
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

export async function encrypt(data, peerKey) {
	if (!data) {
		return data;
	}

	try {
		// Encrypt with the peer's public key
		data = (await FederationKeys.loadKey(peerKey, 'public')).encrypt(data);

		// Encrypt with the local private key
		return (await FederationKeys.getPrivateKey()).encryptPrivate(data);
	} catch (err) {
		cryptLogger.error(err);

		throw new Error('Could not encrypt');
	}
}
