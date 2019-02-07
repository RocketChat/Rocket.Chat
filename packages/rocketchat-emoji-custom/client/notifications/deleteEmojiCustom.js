import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { deleteEmojiCustom } from '../lib/emojiCustom';

Meteor.startup(() =>
	RocketChat.Notifications.onLogged('deleteEmojiCustom', (data) => deleteEmojiCustom(data.emojiData))
);
