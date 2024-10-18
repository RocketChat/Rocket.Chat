import type { IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { migrateVisitorIfMissingContact } from '../../../livechat/server/lib/Contacts';

export async function maybeMigrateLivechatRoom(room: IRoom | null, options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
	if (room?.t !== 'l') {
		return room;
	}

	const livechatRoom = room as IOmnichannelRoom;

	// Already migrated
	if (livechatRoom.v.contactId) {
		return livechatRoom;
	}

	const contactId = await migrateVisitorIfMissingContact(livechatRoom.v._id, livechatRoom.source);

	// Did not migrate
	if (!contactId) {
		return livechatRoom;
	}

	// Load the room again with the same options so it can be reloaded with the contactId in place
	return Rooms.findOneById(livechatRoom._id, options);
}
