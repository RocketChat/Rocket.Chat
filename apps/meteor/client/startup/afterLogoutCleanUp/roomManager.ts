import { Meteor } from 'meteor/meteor';

import { LegacyRoomManager } from '../../../app/ui-utils/client';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add(
		'afterLogoutCleanUp',
		() => LegacyRoomManager.closeAllRooms(),
		callbacks.priority.MEDIUM,
		'roommanager-after-logout-cleanup',
	);
});
