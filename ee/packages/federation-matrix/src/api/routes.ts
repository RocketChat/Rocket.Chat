import { Router } from '@rocket.chat/http-router';

import { getWellKnownRoutes } from './.well-known/server.js';
import { getClientRoutes } from './_matrix/client/index.js';
import { getMatrixInviteRoutes } from './_matrix/invite.js';
import { getKeyServerRoutes } from './_matrix/key/server.js';
import { getMatrixMakeLeaveRoutes } from './_matrix/make-leave.js';
import { getMatrixMediaBridgeRoutes } from './_matrix/media-bridge.js';
import { getMatrixMediaRoutes } from './_matrix/media.js';
import { getMatrixProfilesRoutes } from './_matrix/profiles.js';
import { getMatrixRoomsRoutes } from './_matrix/rooms.js';
import { getMatrixSendJoinRoutes } from './_matrix/send-join.js';
import { getMatrixSendLeaveRoutes } from './_matrix/send-leave.js';
import { getMatrixTransactionsRoutes } from './_matrix/transactions.js';
import { getFederationVersionsRoutes } from './_matrix/versions.js';
import { isFederationDomainAllowedMiddleware } from './middlewares/isFederationDomainAllowed.js';
import { isFederationEnabledMiddleware } from './middlewares/isFederationEnabled.js';
import { isLicenseEnabledMiddleware } from './middlewares/isLicenseEnabled.js';

export const getFederationRoutes = (version: string): { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known/matrix'> } => {
	const matrix = new Router('/_matrix');
	// the router answers every path under its base, and the rest of /.well-known belongs to other protocols
	const wellKnown = new Router('/.well-known/matrix');

	matrix
		.use(isFederationEnabledMiddleware)
		.use(isLicenseEnabledMiddleware)
		.use(getKeyServerRoutes())
		.use(getFederationVersionsRoutes(version))
		.use(getClientRoutes())
		.use(getMatrixMediaBridgeRoutes())
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
