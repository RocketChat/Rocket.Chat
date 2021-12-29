import { FederationKeys } from '../../../models/server/raw';

// Create key pair if needed
(async () => {
	if (!(await FederationKeys.getPublicKey())) {
		await FederationKeys.generateKeys();
	}
})();
