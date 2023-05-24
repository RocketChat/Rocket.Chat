import { Meteor } from 'meteor/meteor';
import JoyPixels from 'JoyPixels';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(function () {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => JoyPixels.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'JoyPixels-shortnameToUnicode',
	);
});
