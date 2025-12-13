import 'reflect-metadata';

export { FederationMatrix, validateFederatedUsername } from './FederationMatrix';

export { generateEd25519RandomSecretKey } from '@rocket.chat/federation-sdk';

export { getFederationRoutes } from './api/routes';

export { setupFederationMatrix, configureFederationMatrixSettings } from './setup';
