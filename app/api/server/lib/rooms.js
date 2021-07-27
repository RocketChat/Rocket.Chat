import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Rooms } from '../../../models/server/raw';
import { Subscriptions } from '../../../models';

export async function findAdminRooms({ uid, filter, types = [], pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(uid, 'view-room-administration')) {
		throw new Error('error-not-authorized');
	}
	const fields = {
		prid: 1,
		fname: 1,
		name: 1,
		t: 1,
		cl: 1,
		u: 1,
		usernames: 1,
		usersCount: 1,
		muted: 1,
		unmuted: 1,
		ro: 1,
		default: 1,
		favorite: 1,
		featured: 1,
		topic: 1,
		msgs: 1,
		archived: 1,
		tokenpass: 1,
		teamId: 1,
		teamMain: 1,
	};

	const name = filter && filter.trim();
	const discussion = types && types.includes('discussions');
	const includeTeams = types && types.includes('teams');
	const showOnlyTeams = types.length === 1 && types.includes('teams');
	const typesToRemove = ['discussions', 'teams'];
	const showTypes = Array.isArray(types) ? types.filter((type) => !typesToRemove.includes(type)) : [];
	const options = {
		fields,
		sort: sort || { default: -1, name: 1 },
		skip: offset,
		limit: count,
	};

	let cursor;
	if (name && showTypes.length) {
		cursor = Rooms.findByNameContainingAndTypes(name, showTypes, discussion, includeTeams, showOnlyTeams, options);
	} else if (showTypes.length) {
		cursor = Rooms.findByTypes(showTypes, discussion, includeTeams, showOnlyTeams, options);
	} else {
		cursor = Rooms.findByNameContaining(name, discussion, includeTeams, showOnlyTeams, options);
	}

	const total = await cursor.count();

	const rooms = await cursor.toArray();

	return {
		rooms,
		count: rooms.length,
		offset,
		total,
	};
}

export async function findAdminRoom({ uid, rid }) {
	if (!await hasPermissionAsync(uid, 'view-room-administration')) {
		throw new Error('error-not-authorized');
	}
	const fields = {
		prid: 1,
		fname: 1,
		name: 1,
		t: 1,
		cl: 1,
		u: 1,
		usernames: 1,
		usersCount: 1,
		muted: 1,
		unmuted: 1,
		ro: 1,
		default: 1,
		favorite: 1,
		featured: 1,
		topic: 1,
		msgs: 1,
		archived: 1,
		tokenpass: 1,
		announcement: 1,
		description: 1,
	};

	return Rooms.findOneById(rid, { fields });
}

export async function findChannelAndPrivateAutocomplete({ uid, selector }) {
	const options = {
		fields: {
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

	const userRoomsIds = Subscriptions.cachedFindByUserId(uid, { fields: { rid: 1 } })
		.fetch()
		.map((item) => item.rid);

	const rooms = await Rooms.findRoomsWithoutDiscussionsByRoomIds(selector.name, userRoomsIds, options).toArray();

	return {
		items: rooms,
	};
}

export async function findRoomsAvailableForTeams({ uid, name }) {
	const options = {
		fields: {
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

	const userRooms = Subscriptions.findByUserIdAndRoles(uid, ['owner'], { fields: { rid: 1 } })
		.fetch()
		.map((item) => item.rid);

	const rooms = await Rooms.findChannelAndGroupListWithoutTeamsByNameStartingByOwner(uid, name, userRooms, options).toArray();

	return {
		items: rooms,
	};
}
