import { Room } from '@rocket.chat/core-services';
import type { IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { isObject } from '../../../../lib/utils/isObject';
import { createDirectMessage } from '../../../../server/methods/createDirectMessage';

export const getRoomByNameOrIdWithOptionToJoin = async ({
	user,
	nameOrId = '',
	type,
	tryDirectByUserIdOnly = false,
	joinChannel = true,
	errorOnEmpty = true,
}: {
	user: Pick<IUser, '_id' | 'username'>;
	nameOrId: string;
	type?: RoomType;
	tryDirectByUserIdOnly?: boolean;
	joinChannel?: boolean;
	errorOnEmpty?: boolean;
}): Promise<IRoom | null> => {
	let room: IRoom | null;

	// If the nameOrId starts with #, then let's try to find a channel or group
	if (nameOrId.startsWith('#')) {
		nameOrId = nameOrId.substring(1);
		room = await Rooms.findOneByIdOrName(nameOrId);
	} else if (nameOrId.startsWith('@') || type === 'd') {
		// If the nameOrId starts with @ OR type is 'd', then let's try just a direct message
		nameOrId = nameOrId.replace('@', '');

		let roomUser;
		if (tryDirectByUserIdOnly) {
			roomUser = await Users.findOneById(nameOrId);
		} else {
			roomUser = await Users.findOne({
				$or: [{ _id: nameOrId }, { username: nameOrId }],
			});
		}

		room = isObject(roomUser)
			? await Rooms.findOneDirectRoomContainingAllUserIDs([...new Set([user._id, roomUser._id])])
			: await Rooms.findOneById(nameOrId);

		// If the room hasn't been found yet, let's try some more
		if (!isObject(room)) {
			// If the roomUser wasn't found, then there's no destination to point towards
			// so return out based upon errorOnEmpty
			if (!isObject(roomUser)) {
				if (errorOnEmpty) {
					throw new Meteor.Error('invalid-channel');
				} else {
					return null;
				}
			}

			const { rid } = await createDirectMessage([roomUser.username], user._id);

			return Rooms.findOneById(rid);
		}
	} else {
		// Otherwise, we'll treat this as a channel or group.
		room = await Rooms.findOneByIdOrName(nameOrId);
	}

	// If no room was found, handle the room return based upon errorOnEmpty
	if (!room && errorOnEmpty) {
		throw new Meteor.Error('invalid-channel');
	}

	if (room === null) {
		return null;
	}

	// If a room was found and they provided a type to search, then check
	// and if the type found isn't what we're looking for then handle
	// the return based upon errorOnEmpty
	if (type && room.t !== type) {
		if (errorOnEmpty) {
			throw new Meteor.Error('invalid-channel');
		} else {
			return null;
		}
	}

	// If the room type is channel and joinChannel has been passed, try to join them
	// if they can't join the room, this will error out!
	if (room.t === 'c' && joinChannel) {
		await Room.join({ room, user });
	}

	return room;
};
