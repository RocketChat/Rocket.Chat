import { Meteor } from 'meteor/meteor';
import emojione from 'emojione';

import { getUserPreference } from '../../utils';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(function () {
	callbacks.add(
		'beforeSendMessageNotifications',
		(message) => emojione.shortnameToUnicode(message),
		callbacks.priority.MEDIUM,
		'emojione-shortnameToUnicode',
	);

	callbacks.add(
		'beforeSaveMessage',
		(message) => {
			const shouldConvertAscii = getUserPreference(Meteor.userId(), 'convertAsciiEmoji');
			if (shouldConvertAscii && message.msg) {
				message.msg = emojione.asciiToShort(message.msg);
			}

			return message;
		},
		callbacks.priority.MEDIUM,
		'emojione-asciiToShort',
	);
});
