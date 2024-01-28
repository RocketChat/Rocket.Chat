import joypixels from 'joypixels';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => joypixels.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'joypixels-shortnameToUnicode',
	);
});
