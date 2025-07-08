import { Router } from '@rocket.chat/http-router';

import { getWellKnownRoutes } from './.well-known/server';
import { getMatrixInviteRoutes } from './_matrix/invite';
import { getKeyServerRoutes } from './_matrix/key/server';
import { getMatrixProfilesRoutes } from './_matrix/profiles';
import { getMatrixRoomsRoutes } from './_matrix/rooms';
import { getMatrixSendJoinRoutes } from './_matrix/send-join';
import { getMatrixTransactionsRoutes } from './_matrix/transactions';
import { getFederationVersionsRoutes } from './_matrix/versions';

const matrixRoutes = new Router('/_matrix');
const wellknownRoutes = new Router('/.well-known');

export const getAllMatrixRoutes = () => {
	matrixRoutes
		.use(getMatrixInviteRoutes(matrixRoutes))
		.use(getMatrixProfilesRoutes(matrixRoutes))
		.use(getMatrixRoomsRoutes(matrixRoutes))
		.use(getMatrixSendJoinRoutes(matrixRoutes))
		.use(getMatrixTransactionsRoutes(matrixRoutes))
		.use(getFederationVersionsRoutes(matrixRoutes))
		.use(getKeyServerRoutes(matrixRoutes));

	wellknownRoutes.use(getWellKnownRoutes(wellknownRoutes));

	return {
		matrix: matrixRoutes.router,
		wellKnown: wellknownRoutes.router,
	};
};
