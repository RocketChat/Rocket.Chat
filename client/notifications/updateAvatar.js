import { Meteor } from 'meteor/meteor';

import { updateAvatarOfUsername, updateAvatarOfRoom } from '../../app/ui-utils';
import { Notifications } from '../../app/notifications';

Meteor.startup(function() {
	Notifications.onLogged('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});

	Notifications.onLogged('updateRoomAvatar', function(data) {
		updateAvatarOfRoom(data.roomId);
	});
});
