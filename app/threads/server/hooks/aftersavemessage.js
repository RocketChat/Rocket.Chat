import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks/server';
import { settings } from '../../settings';
import { reply } from '../../lib/Thread';
import { sendAllNotifications } from '../../../lib/server/lib';

Meteor.startup(function() {
	const metaData = function(message) {
		if (message.tmid) {
			reply({ tmid: message.tmid }, message);
		}
		return message;
	};

	const notification = function(message, room) {
		sendAllNotifications(message, room, message.replies);
	};

	settings.get('Threads_enabled', function(key, value) {
		if (value) {
			callbacks.add('afterSaveMessage', metaData, callbacks.priority.LOW, 'Threads');
			return callbacks.add('afterSaveMessage', notification, callbacks.priority.LOW, 'Notification');
		}
		callbacks.remove('afterSaveMessage', 'Threads');
		callbacks.remove('afterSaveMessage', 'Notification');
	});

});
