/* globals emojione */
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	RocketChat.callbacks.add('beforeSendMessageNotifications', (message) => emojione.shortnameToUnicode(message));
});
