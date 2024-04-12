import { Meteor } from 'meteor/meteor';

import { LegacyRoomManager } from '../../../app/ui-utils/client';
import { callbacks } from '../../../lib/callbacks';
import { afterLogoutCleanUpCallback } from '../../../lib/callbacks/afterLogoutCleanUpCallback';

Meteor.startup(() => {
	afterLogoutCleanUpCallback.add(() => LegacyRoomManager.closeAllRooms(), callbacks.priority.MEDIUM, 'roommanager-after-logout-cleanup');
});
