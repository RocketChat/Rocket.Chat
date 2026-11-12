import type { IInternalFederationBridge } from '../../../src/server/bridges/index.js';

export class TestsInternalFederationBridge implements IInternalFederationBridge {
	public async getPrivateKey(): Promise<string> {
		return 'fake_private-key';
	}

	public async getPublicKey(): Promise<string> {
		return 'fake_public-key';
	}
}
