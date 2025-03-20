import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { LegacyRoomManager } from '../../app/ui-utils/client';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	// Reload rooms after login
	let currentUsername: string | undefined = undefined;
	Tracker.autorun(() => {
		const user = Meteor.user();
		if (currentUsername === undefined && (user ? user.username : undefined)) {
			currentUsername = user?.username;
			LegacyRoomManager.closeAllRooms();
			// Reload only if the current route is a channel route
			const routeName = router.getRouteName();
			if (!routeName) {
				return;
			}
			const roomType = roomCoordinator.getRouteNameIdentifier(routeName);
			if (roomType) {
				router; // TODO: fix this
				// router.navigate(0);
			}
		}
	});
});
