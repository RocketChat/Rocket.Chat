import type { FederationKey } from '@rocket.chat/core-typings';
import type NodeRSA from 'node-rsa';

import type { IBaseModel } from './IBaseModel';

export interface IFederationKeysModel extends IBaseModel<FederationKey> {
	getKey(type: FederationKey['type']): Promise<string | null>;

	loadKey(keyData: NodeRSA.Key, type: FederationKey['type']): NodeRSA;

	generateKeys(): Promise<{
		privateKey: '' | NodeRSA | null;
		publicKey: '' | NodeRSA | null;
	}>;

	getPrivateKey(): Promise<'' | NodeRSA | null>;

	getPrivateKeyString(): Promise<string | null>;

	getPublicKey(): Promise<'' | NodeRSA | null>;

	getPublicKeyString(): Promise<string | null>;
}
