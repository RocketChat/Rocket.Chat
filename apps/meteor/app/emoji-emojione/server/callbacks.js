import { Meteor } from 'meteor/meteor';
import emoji-toolkit from 'emoji-toolkit';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(function () {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => emoji-toolkit.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'emoji-toolkit-shortnameToUnicode',
	);
});
