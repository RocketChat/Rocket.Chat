import 'reflect-metadata';

export { FederationMatrix, validateFederatedUsername } from './FederationMatrix';

export { generateEd25519RandomSecretKey, FederationValidationError } from '@rocket.chat/federation-sdk';

export { getFederationRoutes } from './api/routes';

export { setupFederationMatrix, configureFederationMatrixSettings } from './setup';

export { isFederationDomainAllowed, isFederationDomainAllowedFromUsernames } from './api/middlewares/isFederationDomainAllowed';
