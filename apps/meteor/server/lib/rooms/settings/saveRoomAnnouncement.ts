import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import type { UpdateResult } from 'mongodb';

export const saveRoomAnnouncement = async function (
	rid: string,
	roomAnnouncement: string,
	user: IUser,
	sendMessage = true,
): Promise<UpdateResult> {
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
