import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';

import { hasPermission } from '../../../authorization/server';
import { RocketChatFile } from '../../../file/server';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

Meteor.methods({
	uploadCustomSound(binaryContent, contentType, soundData) {
		if (!hasPermission(this.userId, 'manage-sounds')) {
			throw new Meteor.Error('not_authorized');
		}

		const file = Buffer.from(binaryContent, 'binary');

		const rs = RocketChatFile.bufferToStream(file);
		RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.extension}`);
		const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.${soundData.extension}`, contentType);
		ws.on('end', () => setTimeout(() => api.broadcast('notify.updateCustomSound', { soundData }), 500));

		rs.pipe(ws);
	},
});
