import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings';
import { checkWaitingQueue, updateInactiveRoomProperty } from './lib/Helper';
import { VisitorInactivityMonitor } from './lib/VisitorInactivityMonitor';
import './lib/query.helper';

Meteor.startup(function() {
	settings.onload('Livechat_maximum_chats_per_agent', function(/* key, value */) {
		checkWaitingQueue();
	});
	settings.onload('Livechat_auto_close_inactive_rooms', function(_, value) {
		updateInactiveRoomProperty(value);
	});
	settings.onload('Livechat_visitor_inactivity_timeout', function() {
		const closeInactiveRooms = settings.get('Livechat_auto_close_inactive_rooms');
		if (closeInactiveRooms) {
			updateInactiveRoomProperty(closeInactiveRooms);
		}
	});
	new VisitorInactivityMonitor().start();
});
