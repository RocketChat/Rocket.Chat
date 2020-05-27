import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { Rooms } from '../../../app/models/server/raw';

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
	};

	const name = filter && filter.trim();
	const discussion = types && types.includes('discussions');
	const showTypes = Array.isArray(types) ? types.filter((type) => type !== 'discussions') : [];
	const options = {
		fields,
		sort: sort || { default: -1, name: 1 },
		skip: offset,
		limit: count,
	};

	let cursor = Rooms.findByNameContaining(name, discussion, options);

	if (name && showTypes.length) {
		cursor = Rooms.findByNameContainingAndTypes(name, showTypes, discussion, options);
	} else if (showTypes.length) {
		cursor = Rooms.findByTypes(showTypes, discussion, options);
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
	};

	return Rooms.findOneById(rid, { fields });
}

export async function findChannelAndPrivateAutocomplete({ uid, selector }) {
	if (!await hasPermissionAsync(uid, 'view-other-user-channels')) {
		return { items: [] };
	}
	const options = {
		fields: {
			_id: 1,
			name: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const rooms = await Rooms.findChannelAndPrivateByNameStarting(selector.name, options).toArray();

	return {
		items: rooms,
	};
}
