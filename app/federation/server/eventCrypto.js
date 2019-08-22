import { FederationKeys } from '../../models/server';
import { Federation } from './federation';

export class EventCrypto {}

EventCrypto.encrypt = (payload, remotePublicKey) => {
	// Encrypt with the remote public key
	payload = FederationKeys.loadKey(remotePublicKey, 'public').encrypt(payload);

	// Encrypt with the local private key
	return Federation.privateKey.encryptPrivate(payload);
};

EventCrypto.decrypt = (payload, remotePublicKey) => {
	const payloadBuffer = Buffer.from(payload);

	// Decrypt with the remote public key
	payload = FederationKeys.loadKey(remotePublicKey, 'public').decryptPublic(payloadBuffer);

	// Decrypt with the local private key
	return Federation.privateKey.decrypt(payload).toString();
};
