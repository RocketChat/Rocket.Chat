import { Meteor } from 'meteor/meteor';

import { shortnameToUnicode } from '../../../../app/emoji-native/lib/shortnameToUnicode';
import { callbacks } from '../../callbacks';

Meteor.startup(() => {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'native-emoji-shortnameToUnicode',
	);
});
