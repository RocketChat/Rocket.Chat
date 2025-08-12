import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult } from 'mongodb';

export const saveRoomAnnouncement = async function (
	rid: string,
	roomAnnouncement: string,
	user: IUser,
	sendMessage = true,
): Promise<UpdateResult> {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomAnnouncement',
		});
	}

	let message;
	let announcementDetails;
	if (typeof roomAnnouncement === 'string') {
		message = roomAnnouncement;
	} else {
		({ message, ...announcementDetails } = roomAnnouncement);
	}

	const updated = await Rooms.setAnnouncementById(rid, message, announcementDetails);
	if (updated && sendMessage) {
		await Message.saveSystemMessage('room_changed_announcement', rid, message, user);
	}

	return updated;
};
