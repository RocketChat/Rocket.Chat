import { isOmnichannelRoom, type IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { migrateVisitorIfMissingContact } from '../../../livechat/server/lib/contacts/migrateVisitorIfMissingContact';

export async function maybeMigrateLivechatRoom(room: IRoom | null, options: FindOptions<IRoom> = {}): Promise<IRoom | null> {
	if (!room || !isOmnichannelRoom(room)) {
		return room;
	}

	// Already migrated
	if (room.v.contactId) {
		return room;
	}

	const contactId = await migrateVisitorIfMissingContact(room.v._id, room.source);

	// Did not migrate
	if (!contactId) {
		return room;
	}

	// Load the room again with the same options so it can be reloaded with the contactId in place
	return Rooms.findOneById(room._id, options);
}
