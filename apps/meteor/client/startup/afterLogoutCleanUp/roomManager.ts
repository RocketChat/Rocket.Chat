import { Meteor } from 'meteor/meteor';

import { RoomManager } from '../../../app/ui-utils/client';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add('afterLogoutCleanUp', () => RoomManager.closeAllRooms(), callbacks.priority.MEDIUM, 'roommanager-after-logout-cleanup');
});
