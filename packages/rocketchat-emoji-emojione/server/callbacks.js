import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { emojione } from 'meteor/emojione:emojione';

Meteor.startup(function() {
	RocketChat.callbacks.add('beforeSendMessageNotifications', (message) => emojione.shortnameToUnicode(message));
});
