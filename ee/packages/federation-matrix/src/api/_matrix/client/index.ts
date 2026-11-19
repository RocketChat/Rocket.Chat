import { Router } from '@rocket.chat/http-router';

import { addAccountRoutes } from './account.js';
import { addDirectoryRoutes } from './directory.js';
import { addClientMediaRoutes } from './media.js';
import { addPresenceRoutes } from './presence.js';
import { addProfileRoutes } from './profile.js';
import { addRoomsLifecycleRoutes } from './rooms-lifecycle.js';
import { addRoomsMessagingRoutes } from './rooms-messaging.js';
import { addRoomsStateRoutes } from './rooms-state.js';
import { addUserRoutes } from './user.js';
import { addVersionsRoutes } from './versions.js';

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
