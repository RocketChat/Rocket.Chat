import { Router } from '@rocket.chat/http-router';

import { addAccountRoutes } from './account';
import { addDirectoryRoutes } from './directory';
import { addClientMediaRoutes } from './media';
import { addPresenceRoutes } from './presence';
import { addProfileRoutes } from './profile';
import { addRoomsLifecycleRoutes } from './rooms-lifecycle';
import { addRoomsMessagingRoutes } from './rooms-messaging';
import { addRoomsStateRoutes } from './rooms-state';
import { addUserRoutes } from './user';
import { addVersionsRoutes } from './versions';

export const getClientRoutes = () => {
	const router = new Router('/client');

	addVersionsRoutes(router);
	addAccountRoutes(router);
	addProfileRoutes(router);
	addPresenceRoutes(router);
	addDirectoryRoutes(router);
	addRoomsLifecycleRoutes(router);
	addRoomsStateRoutes(router);
	addRoomsMessagingRoutes(router);
	addUserRoutes(router);
	addClientMediaRoutes(router);

	return router;
};
