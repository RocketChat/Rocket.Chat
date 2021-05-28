import { FederationKeys } from '../../../../server/models';

// Create key pair if needed
if (!FederationKeys.getPublicKey()) {
	FederationKeys.generateKeys();
}
