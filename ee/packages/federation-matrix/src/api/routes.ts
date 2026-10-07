import { Router } from '@rocket.chat/http-router';

import { getWellKnownRoutes } from './.well-known/server';
import { getClientRoutes } from './_matrix/client';
import { getMatrixInviteRoutes } from './_matrix/invite';
import { getKeyServerRoutes } from './_matrix/key/server';
import { getMatrixMakeLeaveRoutes } from './_matrix/make-leave';
import { getMatrixMediaRoutes } from './_matrix/media';
import { getMatrixMediaBridgeRoutes } from './_matrix/media-bridge';
import { getMatrixOpenIdRoutes } from './_matrix/openid';
import { getMatrixProfilesRoutes } from './_matrix/profiles';
import { getMatrixRoomsRoutes } from './_matrix/rooms';
import { getMatrixRTCRoutes } from './_matrix/rtc';
import { getMatrixSendJoinRoutes } from './_matrix/send-join';
import { getMatrixSendLeaveRoutes } from './_matrix/send-leave';
import { getMatrixTransactionsRoutes } from './_matrix/transactions';
import { getFederationVersionsRoutes } from './_matrix/versions';
import { getMatrixRTCTokenServiceRoutes } from './matrixrtc/livekit-jwt';
import { isFederationDomainAllowedMiddleware } from './middlewares/isFederationDomainAllowed';
import { isFederationEnabledMiddleware } from './middlewares/isFederationEnabled';
import { isLicenseEnabledMiddleware } from './middlewares/isLicenseEnabled';
import type { MATRIXRTC_TOKEN_SERVICE_PATH } from '../matrixrtc/tokens/service';

export const getFederationRoutes = (
	version: string,
): { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known'>; matrixRTC: Router<typeof MATRIXRTC_TOKEN_SERVICE_PATH> } => {
	const matrix = new Router('/_matrix');
	const wellKnown = new Router('/.well-known');

	matrix
		.use(isFederationEnabledMiddleware)
		.use(isLicenseEnabledMiddleware)
		.use(getKeyServerRoutes())
		.use(getFederationVersionsRoutes(version))
		// Unsigned by design: the services of other homeservers call it, not the homeservers themselves.
		.use(getMatrixOpenIdRoutes())
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
		.use(getMatrixMakeLeaveRoutes())
		.use(getMatrixRTCRoutes());

	wellKnown.use(isFederationEnabledMiddleware).use(isLicenseEnabledMiddleware).use(getWellKnownRoutes());

	return { matrix, wellKnown, matrixRTC: getMatrixRTCTokenServiceRoutes() };
};
