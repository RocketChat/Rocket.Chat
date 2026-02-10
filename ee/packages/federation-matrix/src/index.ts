import 'reflect-metadata';

export { validateFederatedUsername } from './helpers/validateFederatedUsername';

export { FederationMatrix } from './FederationMatrix';

export { generateEd25519RandomSecretKey } from '@rocket.chat/federation-sdk';

export { getFederationRoutes } from './api/routes';

export { setupFederationMatrix, configureFederationMatrixSettings } from './setup';
