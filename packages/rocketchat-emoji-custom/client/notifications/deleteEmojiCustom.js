/* globals deleteEmojiCustom */
import { Meteor } from 'meteor/meteor';

Meteor.startup(() =>
	RocketChat.Notifications.onLogged('deleteEmojiCustom', (data) => deleteEmojiCustom(data.emojiData))
);
