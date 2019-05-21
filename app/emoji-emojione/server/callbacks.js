import { Meteor } from 'meteor/meteor';
import emojione from 'emojione';

import { callbacks } from '../../callbacks';

Meteor.startup(function() {
	callbacks.add('beforeSendMessageNotifications', (message) => emojione.shortnameToUnicode(message));
});
