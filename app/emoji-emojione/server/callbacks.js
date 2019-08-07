import { Meteor } from 'meteor/meteor';
import { shortnameToUnicode } from 'emojione';

import { callbacks } from '../../callbacks';

Meteor.startup(function() {
	callbacks.add('beforeSendMessageNotifications', (message) => shortnameToUnicode(message), callbacks.priority.MEDIUM, 'emojione-shortnameToUnicode');
});
