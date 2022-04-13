import NodeRSA from 'node-rsa';

import { BaseRaw } from './BaseRaw';

type T = {
	type: 'private' | 'public';
	key: string;
};

export class FederationKeysRaw extends BaseRaw<T> {
	async getKey(type: T['type']): Promise<string | null> {
		const keyResource = await this.findOne({ type });

		if (!keyResource) {
			return null;
		}

		return keyResource.key;
	}

	loadKey(keyData: NodeRSA.Key, type: T['type']): NodeRSA {
		return new NodeRSA(keyData, `pkcs8-${type}-pem`);
	}

	async generateKeys(): Promise<{
		privateKey: '' | NodeRSA | null;
		publicKey: '' | NodeRSA | null;
	}> {
		const key = new NodeRSA({ b: 512 });

		key.generateKeyPair();

		await this.deleteMany({});

		await this.insertOne({
			type: 'private',
			key: key.exportKey('pkcs8-private-pem').replace(/\n|\r/g, ''),
		});

		await this.insertOne({
			type: 'public',
			key: key.exportKey('pkcs8-public-pem').replace(/\n|\r/g, ''),
		});

		return {
			privateKey: await this.getPrivateKey(),
			publicKey: await this.getPublicKey(),
		};
	}

	async getPrivateKey(): Promise<'' | NodeRSA | null> {
		const keyData = await this.getKey('private');

		return keyData && this.loadKey(keyData, 'private');
	}

	getPrivateKeyString(): Promise<string | null> {
		return this.getKey('private');
	}

	async getPublicKey(): Promise<'' | NodeRSA | null> {
		const keyData = await this.getKey('public');

		return keyData && this.loadKey(keyData, 'public');
	}

	getPublicKeyString(): Promise<string | null> {
		return this.getKey('public');
	}
}
