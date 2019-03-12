import { Meteor } from 'meteor/meteor';
import { Notifications } from '/app/notifications';
import { deleteEmojiCustom } from '../lib/emojiCustom';

Meteor.startup(() =>
	Notifications.onLogged('deleteEmojiCustom', (data) => deleteEmojiCustom(data.emojiData))
);
