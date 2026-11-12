import 'reflect-metadata';

export { validateFederatedUsername } from './helpers/validateFederatedUsername.js';

export { isReservedByExclusiveBridge } from './helpers/isReservedByExclusiveBridge.js';

export { FederationMatrix } from './FederationMatrix.js';

export { generateEd25519RandomSecretKey } from '@rocket.chat/federation-sdk';

export { getFederationRoutes } from './api/routes.js';

export { setupFederationMatrix, configureFederationMatrixSettings } from './setup.js';
