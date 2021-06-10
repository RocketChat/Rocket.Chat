import { FederationKeys } from '../../../models';

// Create key pair if needed
if (!FederationKeys.getPublicKey()) {
	FederationKeys.generateKeys();
}
