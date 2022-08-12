import { FederationKeys } from '@rocket.chat/models';

// Create key pair if needed
(async () => {
	if (!(await FederationKeys.getPublicKey())) {
		await FederationKeys.generateKeys();
	}
})();
