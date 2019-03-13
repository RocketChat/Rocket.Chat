import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { Notifications } from '/app/notifications';
import { RocketChatFile } from '/app/file';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

Meteor.methods({
	uploadCustomSound(binaryContent, contentType, soundData) {
		if (!hasPermission(this.userId, 'manage-sounds')) {
			throw new Meteor.Error('not_authorized');
		}

		const file = new Buffer(binaryContent, 'binary');

		const rs = RocketChatFile.bufferToStream(file);
		RocketChatFileCustomSoundsInstance.deleteFile(`${ soundData._id }.${ soundData.extension }`);
		const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${ soundData._id }.${ soundData.extension }`, contentType);
		ws.on('end', Meteor.bindEnvironment(() =>
			Meteor.setTimeout(() => Notifications.notifyAll('updateCustomSound', { soundData }), 500)
		));

		rs.pipe(ws);
	},
});
