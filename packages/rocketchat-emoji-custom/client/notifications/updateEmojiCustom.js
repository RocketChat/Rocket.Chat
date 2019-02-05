import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { updateEmojiCustom } from '../lib/emojiCustom';

Meteor.startup(() =>
	RocketChat.Notifications.onLogged('updateEmojiCustom', (data) => updateEmojiCustom(data.emojiData))
);
