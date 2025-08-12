import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { projectionAllowsAttribute } from './projectionAllowsAttribute';
import { migrateVisitorIfMissingContact } from '../../../livechat/server/lib/contacts/migrateVisitorIfMissingContact';

/**
 * If the room is a livechat room and it doesn't yet have a contact, trigger the migration for its visitor and source
 * The migration will create/use a contact and assign it to every room that matches this visitorId and source.
 **/
export async function maybeMigrateLivechatRoom(
	room: IOmnichannelRoom | null,
	options: FindOptions<IRoom> = {},
): Promise<IOmnichannelRoom | null> {
	if (!room || !isOmnichannelRoom(room)) {
		return room;
	}

	// Already migrated
	if (room.contactId) {
		return room;
	}

	// If the query options specify that contactId is not needed, then do not trigger the migration
	if (!projectionAllowsAttribute('contactId', options)) {
		return room;
	}

	const contactId = await migrateVisitorIfMissingContact(room.v._id, room.source);

	// Did not migrate
	if (!contactId) {
		return room;
	}

	// Load the room again with the same options so it can be reloaded with the contactId in place
	return LivechatRooms.findOneById(room._id, options);
}
