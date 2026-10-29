import { Meteor } from 'meteor/meteor';

import { shortnameToUnicodeOutsideCode } from '../../../../lib/emoji-native/shortnameToUnicodeOutsideCode';
import { callbacks } from '../../callbacks';

Meteor.startup(() => {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => shortnameToUnicodeOutsideCode(message),
		callbacks.priority.MEDIUM,
		'native-emoji-shortnameToUnicode',
	);
});
