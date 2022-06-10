import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';

import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload/server';
import { Rooms, Messages } from '../../../models/server';
import { Avatars } from '../../../models/server/raw';
import { api } from '../../../../server/sdk/api';

export const setRoomAvatar = async function (rid: string, dataURI: string, user: IUser): Promise<void> {
	const fileStore = FileUpload.getStore('Avatars');

	const current = await Avatars.findOneByRoomId(rid);

	if (!dataURI) {
		fileStore.deleteByRoomId(rid);
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_avatar', rid, '', user);
		api.broadcast('room.avatarUpdate', { _id: rid });

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

	fileStore.insert(file, buffer, (err: unknown, result: { etag: string }) => {
		if (err) {
			throw err;
		}

		Meteor.setTimeout(function () {
			if (current) {
				fileStore.deleteById(current._id);
			}
			Rooms.setAvatarData(rid, 'upload', result.etag);
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_avatar', rid, '', user);
			api.broadcast('room.avatarUpdate', { _id: rid, avatarETag: result.etag });
		}, 500);
	});
};
