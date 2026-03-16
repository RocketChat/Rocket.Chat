import emojione from 'emojione';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../server/lib/callbacks';

Meteor.startup(() => {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => emojione.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'emojione-shortnameToUnicode',
	);
});
