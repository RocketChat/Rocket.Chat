import { FederationKeys } from '../../../models/server';

// Create key pair if needed
if (!FederationKeys.getPublicKey()) {
	FederationKeys.generateKeys();
}
