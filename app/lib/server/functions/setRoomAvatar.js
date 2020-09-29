import { Meteor } from 'meteor/meteor';

import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload';
import { Notifications } from '../../../notifications';
import { Rooms, Avatars, Messages } from '../../../models/server';

export const setRoomAvatar = function(rid, dataURI, user) {
	const fileStore = FileUpload.getStore('Avatars');

	const current = Avatars.findOneByRoomId(rid);

	if (!dataURI) {
		fileStore.deleteByRoomId(rid);
		return Rooms.unsetAvatarData(rid);
	}

	const fileData = RocketChatFile.dataURIParse(dataURI);

	const buffer = Buffer.from(fileData.image, 'base64');

	const file = {
		rid,
		type: fileData.contentType,
		size: buffer.length,
		uid: user._id,
	};

	fileStore.insert(file, buffer, (err, result) => {
		Meteor.setTimeout(function() {
			if (current) {
				fileStore.deleteById(current._id);
			}
			Rooms.setAvatarData(rid, 'upload', result.etag);
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_avatar', rid, '', user);
			Notifications.notifyLogged('updateAvatar', { rid, etag: result.etag });
		}, 500);
	});
};
