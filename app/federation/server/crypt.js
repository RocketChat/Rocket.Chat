import { FederationKeys } from '../../models/server';
import { API } from '../../api/server';

import { Federation } from '.';

class Crypt {
	decryptIfNeeded(request, bodyParams) {
		//
		// Look for the domain that sent this event
		const remotePeerDomain = request.headers['x-federation-domain'];

		if (!remotePeerDomain) {
			return API.v1.failure('Domain is unknown, ignoring event');
		}

		let payload;

		//
		// Decrypt payload if needed
		if (remotePeerDomain !== Federation.domain) {
			//
			// Find the peer's public key
			const { publicKey: peerKey } = Federation.dns.search(remotePeerDomain);

			if (!peerKey) {
				return API.v1.failure("Could not find the peer's public key to decrypt");
			}

			payload = Federation.crypt.decrypt(bodyParams, peerKey);
		} else {
			payload = bodyParams;
		}

		return payload;
	}

	encrypt(data, peerKey) {
		if (!data) {
			return data;
		}

		// Encrypt with the peer's public key
		data = FederationKeys.loadKey(peerKey, 'public').encrypt(data);

		// Encrypt with the local private key
		return Federation.privateKey.encryptPrivate(data);
	}

	decrypt(data, peerKey) {
		//
		// Decrypt the payload
		const payloadBuffer = Buffer.from(data);

		// Decrypt with the peer's public key
		try {
			data = FederationKeys.loadKey(peerKey, 'public').decryptPublic(payloadBuffer);

			// Decrypt with the local private key
			data = Federation.privateKey.decrypt(data);
		} catch (err) {
			throw new Error('Could not decrypt');
		}

		return JSON.parse(data.toString());
	}
}

export const crypt = new Crypt();
