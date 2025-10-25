import { getAllServices } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';

import { getWellKnownRoutes } from './.well-known/server';
import { getMatrixInviteRoutes } from './_matrix/invite';
import { getKeyServerRoutes } from './_matrix/key/server';
import { getMatrixMediaRoutes } from './_matrix/media';
import { getMatrixProfilesRoutes } from './_matrix/profiles';
import { getMatrixRoomsRoutes } from './_matrix/rooms';
import { getMatrixSendJoinRoutes } from './_matrix/send-join';
import { getMatrixTransactionsRoutes } from './_matrix/transactions';
import { getFederationVersionsRoutes } from './_matrix/versions';
import { isFederationDomainAllowedMiddleware } from './middlewares/isFederationDomainAllowed';
import { isFederationEnabledMiddleware } from './middlewares/isFederationEnabled';
import { isLicenseEnabledMiddleware } from './middlewares/isLicenseEnabled';

export const getFederationRoutes = (): { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known'> } => {
	const homeserverServices = getAllServices();

	const matrix = new Router('/_matrix');
	const wellKnown = new Router('/.well-known');

	matrix
		.use(isFederationEnabledMiddleware)
		.use(isLicenseEnabledMiddleware)
		.use(getKeyServerRoutes(homeserverServices))
		.use(getFederationVersionsRoutes(homeserverServices))
		.use(isFederationDomainAllowedMiddleware)
		.use(getMatrixInviteRoutes(homeserverServices))
		.use(getMatrixProfilesRoutes(homeserverServices))
		.use(getMatrixRoomsRoutes(homeserverServices))
		.use(getMatrixSendJoinRoutes(homeserverServices))
		.use(getMatrixTransactionsRoutes(homeserverServices))
		.use(getMatrixMediaRoutes(homeserverServices));

	wellKnown.use(isFederationEnabledMiddleware).use(isLicenseEnabledMiddleware).use(getWellKnownRoutes(homeserverServices));

	return { matrix, wellKnown };
};
