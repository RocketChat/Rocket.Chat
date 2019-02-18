import { Meteor } from 'meteor/meteor';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { emojione } from 'meteor/emojione:emojione';

Meteor.startup(function() {
	callbacks.add('beforeSendMessageNotifications', (message) => emojione.shortnameToUnicode(message));
});
