import { Meteor } from 'meteor/meteor';
import { callbacks } from '../../callbacks';
import { emojione } from 'meteor/emojione:emojione';

Meteor.startup(function() {
	callbacks.add('beforeSendMessageNotifications', (message) => emojione.shortnameToUnicode(message));
});
