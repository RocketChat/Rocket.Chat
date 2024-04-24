import { api, dbWatchersDisabled, Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { isRegisterUser } from '@rocket.chat/core-typings';
import { Avatars, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { RocketChatFile } from '../../../file/server';

export const setRoomAvatar = async function (rid: string, dataURI: string, user: IUser): Promise<void> {
	if (!isRegisterUser(user)) {
		throw new Meteor.Error('invalid-user', 'Invalid user', {
			function: 'RocketChat.setRoomAvatar',
		});
	}

	const fileStore = FileUpload.getStore('Avatars');

	const current = await Avatars.findOneByRoomId(rid);

	if (!dataURI) {
		await fileStore.deleteByRoomId(rid);
		await Message.saveSystemMessage('room_changed_avatar', rid, '', user);
		void api.broadcast('room.avatarUpdate', { _id: rid });
		await Rooms.unsetAvatarData(rid);
		return;
	}

	const fileData = RocketChatFile.dataURIParse(dataURI);

	const buffer = Buffer.from(fileData.image, 'base64');

	const file = {
		rid,
		type: fileData.contentType,
		size: buffer.length,
		uid: user._id,
	};

	if (current) {
		await fileStore.deleteById(current._id);
	}

	const result = await fileStore.insert(file, buffer);

	setTimeout(async () => {
		result.etag && (await Rooms.setAvatarData(rid, 'upload', result.etag));
		await Message.saveSystemMessage('room_changed_avatar', rid, '', user);
		void api.broadcast('room.avatarUpdate', { _id: rid, avatarETag: result.etag });
	}, 500);

	if (dbWatchersDisabled && result.etag) {
		const room = await Rooms.findOneById(rid);
		if (room) {
			void api.broadcast('watch.rooms', {
				clientAction: 'updated',
				room: {
					...room,
					avatarETag: result.etag,
				},
			});
		}
	}
};
