import { FederationKeys } from '@rocket.chat/models';

// Create key pair if needed
export async function generateFederationKeys() {
	if (!(await FederationKeys.getPublicKey())) {
		await FederationKeys.generateKeys();
	}
}
