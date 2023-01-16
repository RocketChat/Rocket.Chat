import { Meteor } from 'meteor/meteor';
import emojiToolkit from 'emoji-toolkit';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(function () {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => emojiToolkit.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'emojiToolkit-shortnameToUnicode',
	);
});
