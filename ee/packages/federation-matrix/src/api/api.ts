import { Router } from '@rocket.chat/http-router';

import { getWellKnownRoutes } from './.well-known/server';
import { getMatrixInviteRoutes } from './_matrix/invite';
import { getKeyServerRoutes } from './_matrix/key/server';
import { getMatrixProfilesRoutes } from './_matrix/profiles';
import { getMatrixRoomsRoutes } from './_matrix/rooms';
import { getMatrixSendJoinRoutes } from './_matrix/send-join';
import { getMatrixTransactionsRoutes } from './_matrix/transactions';
import { getFederationVersionsRoutes } from './_matrix/versions';

const matrix = new Router('/_matrix');
const wellKnown = new Router('/.well-known');

export const getAllMatrixRoutes = () => {
	matrix
		.use(getMatrixInviteRoutes(matrix))
		.use(getMatrixProfilesRoutes(matrix))
		.use(getMatrixRoomsRoutes(matrix))
		.use(getMatrixSendJoinRoutes(matrix))
		.use(getMatrixTransactionsRoutes(matrix))
		.use(getFederationVersionsRoutes(matrix))
		.use(getKeyServerRoutes(matrix));

	wellKnown.use(getWellKnownRoutes(wellKnown));

	return {
		matrix,
		wellKnown,
	};
};
