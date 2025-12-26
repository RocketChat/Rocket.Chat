import 'reflect-metadata';

export { FederationMatrix, validateFederatedUsername } from './FederationMatrix';

export { generateEd25519RandomSecretKey } from '@rocket.chat/federation-sdk';

export { FederationValidationError } from './errors/FederationValidationError';

export { getFederationRoutes } from './api/routes';

export { setupFederationMatrix, configureFederationMatrixSettings } from './setup';

export { isFederationDomainAllowed, isFederationDomainAllowedForUsernames } from './api/middlewares/isFederationDomainAllowed';
