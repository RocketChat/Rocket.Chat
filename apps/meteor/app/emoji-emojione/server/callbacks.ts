import emojiToolkit from 'emoji-toolkit';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => emojiToolkit.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'emojione-shortnameToUnicode',
	);
});
