import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../server/lib/callbacks';
import { shortnameToUnicode } from '../lib/unicodeConverters';

Meteor.startup(() => {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'emojione-shortnameToUnicode',
	);
});
