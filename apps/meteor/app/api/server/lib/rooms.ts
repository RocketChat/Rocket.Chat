import type { IRoom, ISubscription, IUser, RoomAdminFieldsType, RoomType } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import type { FindOptions, Sort } from 'mongodb';

import { adminFields } from '../../../../lib/rooms/adminFields';
import { hasAtLeastOnePermissionAsync, hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function findAdminRooms({
	uid,
	filter,
	types = [],
	pagination: { offset, count, sort },
}: {
	uid: string;
	filter: string;
	types: Array<RoomType | 'discussions' | 'teams'>;
	pagination: { offset: number; count: number; sort: Sort };
}): Promise<{
	rooms: IRoom[];
	count: number;
	offset: number;
	total: number;
}> {
	if (!(await hasPermissionAsync(uid, 'view-room-administration'))) {
		throw new Error('error-not-authorized');
	}
	const name = filter?.trim();
	const discussion = types?.includes('discussions');
	const includeTeams = types?.includes('teams');
	const typesToRemove = ['discussions', 'teams'];
	const showTypes = Array.isArray(types) ? types.filter((type): type is RoomType => !typesToRemove.includes(type)) : [];
	const options: FindOptions<IRoom> = {
		projection: adminFields,
		skip: offset,
		limit: count,
	};

	const result = Rooms.findByNameOrFnameContainingAndTypes(name, showTypes, discussion, includeTeams, options);

	const { cursor, totalCount } = result;

	const [rooms, total] = await Promise.all([cursor.sort(sort || { default: -1, name: 1 }).toArray(), totalCount]);

	return {
		rooms,
		count: rooms.length,
		offset,
		total,
	};
}

export async function findAdminRoom({ uid, rid }: { uid: string; rid: string }): Promise<Pick<IRoom, RoomAdminFieldsType> | null> {
	if (!(await hasPermissionAsync(uid, 'view-room-administration'))) {
		throw new Error('error-not-authorized');
	}

	return Rooms.findOneById(rid, { projection: adminFields });
}

export async function findChannelAndPrivateAutocomplete({ uid, selector }: { uid: string; selector: { name: string } }): Promise<{
	items: IRoom[];
}> {
	const options: FindOptions<IRoom> = {
		projection: {
			_id: 1,
			fname: 1,
			name: 1,
			t: 1,
			avatarETag: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const userRoomsIds = (await Subscriptions.findByUserId(uid, { projection: { rid: 1 } }).toArray()).map(
		(item: Pick<ISubscription, 'rid'>) => item.rid,
	);

	const rooms = await Rooms.findRoomsWithoutDiscussionsByRoomIds(selector.name, userRoomsIds, options).toArray();

	return {
		items: rooms,
	};
}

export async function findAdminRoomsAutocomplete({ uid, selector }: { uid: string; selector: { name: string } }): Promise<{
	items: IRoom[];
}> {
	if (!(await hasAtLeastOnePermissionAsync(uid, ['view-room-administration', 'can-audit']))) {
		throw new Error('error-not-authorized');
	}
	const options: FindOptions<IRoom> = {
		projection: {
			_id: 1,
			fname: 1,
			name: 1,
			t: 1,
			avatarETag: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const rooms = await Rooms.findRoomsByNameOrFnameStarting(selector.name, options).toArray();

	return {
		items: rooms,
	};
}

export async function findChannelAndPrivateAutocompleteWithPagination({
	uid,
	selector,
	pagination: { offset, count, sort },
}: {
	uid: string;
	selector: { name: string };
	pagination: { offset: number; count: number; sort: Sort };
}): Promise<{
	items: IRoom[];
	total: number;
}> {
	const userRoomsIds = (await Subscriptions.findByUserId(uid, { projection: { rid: 1 } }).toArray()).map(
		(item: Pick<ISubscription, 'rid'>) => item.rid,
	);

	const options: FindOptions<IRoom> = {
		projection: {
			_id: 1,
			fname: 1,
			name: 1,
			t: 1,
			avatarETag: 1,
		},
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	};

	const { cursor, totalCount } = Rooms.findPaginatedRoomsWithoutDiscussionsByRoomIds(selector.name, userRoomsIds, options);

	const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		items: rooms,
		total,
	};
}

export async function findRoomsAvailableForTeams({ uid, name }: { uid: string; name: string }): Promise<{
	items: IRoom[];
}> {
	const options: FindOptions<IRoom> = {
		projection: {
			_id: 1,
			fname: 1,
			name: 1,
			t: 1,
			avatarETag: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const userRooms = (
		(await Subscriptions.findByUserIdAndRoles(uid, ['owner'], { projection: { rid: 1 } }).toArray()) as Pick<ISubscription, 'rid'>[]
	).map((item) => item.rid);

	const rooms = await Rooms.findChannelAndGroupListWithoutTeamsByNameStartingByOwner(name, userRooms, options).toArray();

	return {
		items: rooms,
	};
}

export async function isUserMutedInRoom(user: Pick<IUser, '_id' | 'username'>, room: IRoom) {
	const { username, _id } = user;

	if (room?.ro === true) {
		if (!(await hasPermissionAsync(_id, 'post-readonly', room._id))) {
			// Unless the user was manually unmuted
			if (username && !room?.unmuted?.includes(username)) {
				// throw new Error("You can't send messages because the room is readonly.");
				return true;
			}
		}
	}

	if (username && room?.muted?.includes(username)) {
		return true;
	}

	return false;
}
