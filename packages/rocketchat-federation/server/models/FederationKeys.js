import NodeRSA from 'node-rsa';
import uuid from 'uuid/v4';
import { Base } from 'meteor/rocketchat:models';

import { logger } from '../logger.js';

class FederationKeysModel extends Base {
	constructor() {
		super('federation_keys');
	}

	getKey(type) {
		const keyResource = this.findOne({ type });

		if (!keyResource) { return null; }

		return keyResource.key;
	}

	loadKey(keyData, type) {
		return new NodeRSA(keyData, `pkcs8-${ type }-pem`);
	}

	generateKeys() {
		logger.info('[federation] Generating key pairs');

		const key = new NodeRSA({ b: 512 });

		key.generateKeyPair();

		this.update({ type: 'private' }, { type: 'private', key: key.exportKey('pkcs8-private-pem').replace(/\n|\r/g, '') }, { upsert: true });

		this.update({ type: 'public' }, { type: 'public', key: key.exportKey('pkcs8-public-pem').replace(/\n|\r/g, '') }, { upsert: true });

		return {
			privateKey: this.getPrivateKey(),
			publicKey: this.getPublicKey(),
		};
	}

	generateUniqueId() {
		const uniqueId = uuid();

		this.update({ type: 'unique' }, { type: 'unique', key: uniqueId }, { upsert: true });
	}

	getUniqueId() {
		return (this.findOne({ type: 'unique' }) || {}).key;
	}

	getPrivateKey() {
		const keyData = this.getKey('private');

		return keyData && this.loadKey(keyData, 'private');
	}

	getPrivateKeyString() {
		return this.getKey('private');
	}

	getPublicKey() {
		const keyData = this.getKey('public');

		return keyData && this.loadKey(keyData, 'public');
	}

	getPublicKeyString() {
		return this.getKey('public');
	}
}

export const FederationKeys = new FederationKeysModel();
