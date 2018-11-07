/* globals updateEmojiCustom */
import { Meteor } from 'meteor/meteor';

Meteor.startup(() =>
	RocketChat.Notifications.onLogged('updateEmojiCustom', (data) => updateEmojiCustom(data.emojiData))
);
