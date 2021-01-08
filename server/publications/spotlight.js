import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasAllPermission, hasPermission, canAccessRoom } from '../../app/authorization/server';
import { Subscriptions, Rooms } from '../../app/models/server';
import { Users } from '../../app/models/server/raw';
import { settings } from '../../app/settings/server';
import { roomTypes } from '../../app/utils/server';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';
import { escapeRegExp } from '../../lib/escapeRegExp';

function fetchRooms(userId, rooms) {
	if (!settings.get('Store_Last_Message') || hasPermission(userId, 'preview-c-room')) {
		return rooms;
	}

	return rooms.map((room) => {
		delete room.lastMessage;
		return room;
	});
}

function searchRooms({ userId, text }) {
	const regex = new RegExp(s.trim(escapeRegExp(text)), 'i');

	const roomOptions = {
		limit: 5,
		fields: {
			t: 1,
			name: 1,
			joinCodeRequired: 1,
			lastMessage: 1,
		},
		sort: {
			name: 1,
		},
	};

	if (userId == null) {
		if (!settings.get('Accounts_AllowAnonymousRead') === true) {
			return [];
		}

		return fetchRooms(userId, Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
	}

	if (hasAllPermission(userId, ['view-outside-room', 'view-c-room'])) {
		const searchableRoomTypes = Object.entries(roomTypes.roomTypes)
			.filter((roomType) => roomType[1].includeInRoomSearch())
			.map((roomType) => roomType[0]);

		const roomIds = Subscriptions.findByUserIdAndTypes(userId, searchableRoomTypes, { fields: { rid: 1 } }).fetch().map((s) => s.rid);
		const exactRoom = Rooms.findOneByNameAndType(text, searchableRoomTypes, roomOptions);
		if (exactRoom) {
			roomIds.push(exactRoom.rid);
		}

		return fetchRooms(userId, Rooms.findByNameAndTypesNotInIds(regex, searchableRoomTypes, roomIds, roomOptions).fetch());
	}

	return [];
}

function mapOutsiders(u) {
	u.outside = true;
	return u;
}

function processLimitAndUsernames(options, usernames, users) {
	// Reduce the results from the limit for the next query
	options.limit -= users.length;

	// If the limit was reached, return
	if (options.limit <= 0) {
		return users;
	}

	// Prevent the next query to get the same users
	usernames.push(...users.map((u) => u.username).filter((u) => !usernames.includes(u)));
}

function _searchInsiderUsers({ rid, text, usernames, options, users, insiderExtraQuery, match = { startsWith: false, endsWith: false } }) {
	// Get insiders first
	if (rid) {
		const searchFields = settings.get('Accounts_SearchFields').trim().split(',');
		users.push(...Promise.await(Users.findByActiveUsersExcept(text, usernames, options, searchFields, insiderExtraQuery, match).toArray()));

		// If the limit was reached, return
		if (processLimitAndUsernames(options, usernames, users)) {
			return users;
		}
	}
}

function _searchOutsiderUsers({ text, usernames, options, users, canListOutsiders, match = { startsWith: false, endsWith: false } }) {
	// Then get the outsiders if allowed
	if (canListOutsiders) {
		const searchFields = settings.get('Accounts_SearchFields').trim().split(',');
		users.push(...Promise.await(Users.findByActiveUsersExcept(text, usernames, options, searchFields, undefined, match).toArray()).map(mapOutsiders));

		// If the limit was reached, return
		if (processLimitAndUsernames(options, usernames, users)) {
			return users;
		}
	}
}

function searchUsers({ userId, rid, text, usernames }) {
	const users = [];

	const options = {
		limit: settings.get('Number_of_users_autocomplete_suggestions'),
		projection: {
			username: 1,
			nickname: 1,
			name: 1,
			status: 1,
			statusText: 1,
			avatarETag: 1,
		},
		sort: {
			[settings.get('UI_Use_Real_Name') ? 'name' : 'username']: 1,
		},
		readPreference: readSecondaryPreferred(Users.col.s.db),
	};

	const room = Rooms.findOneById(rid, { fields: { _id: 1, t: 1, uids: 1 } });

	if (rid && !room) {
		return users;
	}

	const canListOutsiders = hasAllPermission(userId, ['view-outside-room', 'view-d-room']);
	const canListInsiders = canListOutsiders || (rid && canAccessRoom(room, { _id: userId }));

	// If can't list outsiders and, wither, the rid was not passed or the user has no access to the room, return
	if (!canListOutsiders && !canListInsiders) {
		return users;
	}

	const insiderExtraQuery = [];

	if (rid) {
		switch (room.t) {
			case 'd':
				insiderExtraQuery.push({
					_id: { $in: room.uids.filter((id) => id !== userId) },
				});
				break;
			case 'l':
				insiderExtraQuery.push({
					_id: { $in: Subscriptions.findByRoomId(room._id).fetch().map((s) => s.u?._id).filter((id) => id && id !== userId) },
				});
				break;
			default:
				insiderExtraQuery.push({
					__rooms: rid,
				});
				break;
		}
	}

	const searchParams = { rid, text, usernames, options, users, canListOutsiders, insiderExtraQuery };

	// Exact match for username only
	if (rid) {
		const exactMatch = Promise.await(Users.findOneByUsernameAndRoomIgnoringCase(text, rid, { projection: options.projection, readPreference: options.readPreference }));
		if (exactMatch) {
			users.push(exactMatch);
			processLimitAndUsernames(options, usernames, users);
		}
	}

	if (users.length === 0 && canListOutsiders) {
		const exactMatch = Promise.await(Users.findOneByUsernameIgnoringCase(text, { projection: options.projection, readPreference: options.readPreference }));
		if (exactMatch) {
			users.push(exactMatch);
			processLimitAndUsernames(options, usernames, users);
		}
	}

	// Exact match for insiders
	// if (_searchInsiderUsers({ ...searchParams, match: { startsWith: true, endsWith: true } })) {
	// 	return users;
	// }

	// Exact match for outsiders
	// if (_searchOutsiderUsers({ ...searchParams, match: { startsWith: true, endsWith: true } })) {
	// 	return users;
	// }

	// Starts with for insiders
	// if (_searchInsiderUsers({ ...searchParams, match: { startsWith: true } })) {
	// 	return users;
	// }

	// Contains for insiders
	if (_searchInsiderUsers(searchParams)) {
		return users;
	}

	// Starts with for outsiders
	// if (_searchOutsiderUsers({ ...searchParams, match: { startsWith: true } })) {
	// 	return users;
	// }

	// Contains for outsiders
	if (_searchOutsiderUsers(searchParams)) {
		return users;
	}

	return users;
}

Meteor.methods({
	spotlight(text, usernames = [], type = { users: true, rooms: true }, rid) {
		if (text[0] === '#') {
			type.users = false;
			text = text.slice(1);
		}

		if (text[0] === '@') {
			type.rooms = false;
			text = text.slice(1);
		}

		const { userId } = this;

		return {
			users: type.users === true ? searchUsers({ userId, rid, text, usernames }) : [],
			rooms: type.rooms === true ? searchRooms({ userId, text }) : [],
		};
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'spotlight',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
