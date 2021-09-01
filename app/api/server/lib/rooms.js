import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Rooms, Users } from '../../../models/server/raw';
import { Subscriptions, Messages } from '../../../models';
import { convertEphemeralTime } from '../../../lib/server/functions/convertEphemeralTime';

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

export async function updateEphemeralRoom({ uid, rid, newEphemeralTime, newMsgEphemeralTime }) {
	const user = await Users.findOneById(uid, { fields: { username: 1 } });
	if (!user) {
		throw new Error('invalid-user');
	}
	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Error('invalid-room');
	}
	if (!hasPermissionAsync(uid, 'edit-ephemeral-room', rid)) {
		throw new Error('error-not-allowed');
	}
	if (newEphemeralTime) {
		newEphemeralTime = convertEphemeralTime(newEphemeralTime);
		const updated = Rooms.setEphemeralTime(rid, newEphemeralTime);

		// If there was no msg ephemeral time then we need to set message's ephemeral time to room's ephemeral time.
		if (!room.msgEphemeralTime && !newMsgEphemeralTime) {
			Messages.setEphemeralTime(rid, newEphemeralTime);
		}
		const subscriptions = Subscriptions.setEphemeralTime(rid, newEphemeralTime);
		if (!updated || !subscriptions) {
			throw new Error('error-invalid-room', 'Invalid room', { method: 'updateEphemeralTime' });
		}
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('update_ephemeral_time', rid, newEphemeralTime, user);
	}

	if (newMsgEphemeralTime) {
		const msgs = Messages.findByRoomId(rid).fetch();
		Rooms.setMsgEphemeralTime(rid, newMsgEphemeralTime);
		if (newMsgEphemeralTime === 'none') {
			newMsgEphemeralTime = room.ephemeralTime;
			Messages.setEphemeralTime(rid, newMsgEphemeralTime);
		} else {
			const now = new Date();
			msgs.forEach((msg) => {
				newMsgEphemeralTime = convertEphemeralTime(newMsgEphemeralTime, msg.ts);
				if (newMsgEphemeralTime < now) {
					Messages.setEphemeralTimeById(msg._id, now);
				} else {
					Messages.setEphemeralTimeById(msg._id, newMsgEphemeralTime);
				}
			});
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('update_msg_ephemeral_time', rid, newMsgEphemeralTime, user);
		}
	}
}
