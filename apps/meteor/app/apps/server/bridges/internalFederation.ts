import type { IInternalFederationBridge } from '@rocket.chat/apps-engine/server/bridges/IInternalFederationBridge';
import { FederationKeys } from '@rocket.chat/models';

export class AppInternalFederationBridge implements IInternalFederationBridge {
	async getPrivateKey(): Promise<string | null> {
		return FederationKeys.getKey('private');
	}

	async getPublicKey(): Promise<string | null> {
		return FederationKeys.getKey('public');
	}
}
