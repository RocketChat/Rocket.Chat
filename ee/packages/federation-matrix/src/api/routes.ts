import { Router } from '@rocket.chat/http-router';

import { getWellKnownRoutes } from './.well-known/server';
import { getMatrixInviteRoutes } from './_matrix/invite';
import { getKeyServerRoutes } from './_matrix/key/server';
import { getMatrixMakeLeaveRoutes } from './_matrix/make-leave';
import { getMatrixMediaRoutes } from './_matrix/media';
import { getMatrixProfilesRoutes } from './_matrix/profiles';
import { getMatrixRoomsRoutes } from './_matrix/rooms';
import { getMatrixSendJoinRoutes } from './_matrix/send-join';
import { getMatrixSendLeaveRoutes } from './_matrix/send-leave';
import { getMatrixTransactionsRoutes } from './_matrix/transactions';
import { getFederationVersionsRoutes } from './_matrix/versions';
import { isFederationDomainAllowedMiddleware } from './middlewares/isFederationDomainAllowed';
import { isFederationEnabledMiddleware } from './middlewares/isFederationEnabled';
import { isLicenseEnabledMiddleware } from './middlewares/isLicenseEnabled';

export const getFederationRoutes = (version: string): { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known'> } => {
	const matrix = new Router('/_matrix');
	const wellKnown = new Router('/.well-known');

	matrix
		.use(isFederationEnabledMiddleware)
		.use(isLicenseEnabledMiddleware)
		.use(getKeyServerRoutes())
		.use(getFederationVersionsRoutes(version))
		.use(isFederationDomainAllowedMiddleware)
		.use(getMatrixInviteRoutes())
		.use(getMatrixProfilesRoutes())
		.use(getMatrixRoomsRoutes())
		.use(getMatrixSendJoinRoutes())
		.use(getMatrixTransactionsRoutes())
		.use(getMatrixMediaRoutes())
		.use(getMatrixSendLeaveRoutes())
		.use(getMatrixMakeLeaveRoutes());

	wellKnown.use(isFederationEnabledMiddleware).use(isLicenseEnabledMiddleware).use(getWellKnownRoutes());

	return { matrix, wellKnown };
};
