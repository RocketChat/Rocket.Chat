import { Meteor } from 'meteor/meteor';
import { Notifications } from 'meteor/rocketchat:notifications';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { RocketChatFile } from 'meteor/rocketchat:file';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

Meteor.methods({
	uploadEmojiCustom(binaryContent, contentType, emojiData) {
		if (!hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		// delete aliases for notification purposes. here, it is a string rather than an array
		delete emojiData.aliases;
		const file = new Buffer(binaryContent, 'binary');

		const rs = RocketChatFile.bufferToStream(file);
		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${ emojiData.name }.${ emojiData.extension }`));
		const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${ emojiData.name }.${ emojiData.extension }`), contentType);
		ws.on('end', Meteor.bindEnvironment(() =>
			Meteor.setTimeout(() => Notifications.notifyLogged('updateEmojiCustom', { emojiData }), 500)
		));

		rs.pipe(ws);
	},
});
