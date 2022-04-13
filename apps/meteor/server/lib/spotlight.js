import s from 'underscore.string';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasAllPermission, hasPermission, canAccessRoom, roomAccessAttributes } from '../../app/authorization/server';
import { Subscriptions, Rooms } from '../../app/models/server';
import { Users } from '../../app/models/server/raw';
import { settings } from '../../app/settings/server';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';
import { roomCoordinator } from './rooms/roomCoordinator';

export class Spotlight {
	fetchRooms(userId, rooms) {
		if (!settings.get('Store_Last_Message') || hasPermission(userId, 'preview-c-room')) {
			return rooms;
		}

		return rooms.map((room) => {
			delete room.lastMessage;
			return room;
		});
	}

	searchRooms({ userId, text }) {
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
			if (!settings.get('Accounts_AllowAnonymousRead')) {
				return [];
			}

			return this.fetchRooms(userId, Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
		}

		if (!hasAllPermission(userId, ['view-outside-room', 'view-c-room'])) {
			return [];
		}

		const searchableRoomTypeIds = roomCoordinator.searchableRoomTypes();

		const roomIds = Subscriptions.findByUserIdAndTypes(userId, searchableRoomTypeIds, {
			fields: { rid: 1 },
		})
			.fetch()
			.map((s) => s.rid);
		const exactRoom = Rooms.findOneByNameAndType(text, searchableRoomTypeIds, roomOptions);
		if (exactRoom) {
			roomIds.push(exactRoom.rid);
		}

		return this.fetchRooms(userId, Rooms.findByNameAndTypesNotInIds(regex, searchableRoomTypeIds, roomIds, roomOptions).fetch());
	}

	mapOutsiders(u) {
		u.outside = true;
		return u;
	}

	processLimitAndUsernames(options, usernames, users) {
		// Reduce the results from the limit for the next query
		options.limit -= users.length;

		// If the limit was reached, return
		if (options.limit <= 0) {
			return users;
		}

		// Prevent the next query to get the same users
		usernames.push(...users.map((u) => u.username).filter((u) => !usernames.includes(u)));
	}

	_searchInsiderUsers({ rid, text, usernames, options, users, insiderExtraQuery, match = { startsWith: false, endsWith: false } }) {
		// Get insiders first
		if (rid) {
			const searchFields = settings.get('Accounts_SearchFields').trim().split(',');

			users.push(
				...Promise.await(Users.findByActiveUsersExcept(text, usernames, options, searchFields, insiderExtraQuery, match).toArray()),
			);

			// If the limit was reached, return
			if (this.processLimitAndUsernames(options, usernames, users)) {
				return users;
			}
		}
	}

	_searchOutsiderUsers({ text, usernames, options, users, canListOutsiders, match = { startsWith: false, endsWith: false } }) {
		// Then get the outsiders if allowed
		if (canListOutsiders) {
			const searchFields = settings.get('Accounts_SearchFields').trim().split(',');
			users.push(
				...Promise.await(Users.findByActiveUsersExcept(text, usernames, options, searchFields, undefined, match).toArray()).map(
					this.mapOutsiders,
				),
			);

			// If the limit was reached, return
			if (this.processLimitAndUsernames(options, usernames, users)) {
				return users;
			}
		}
	}

	_performExtraUserSearches(/* userId, searchParams */) {
		// Overwrite this method to include extra searches
	}

	searchUsers({ userId, rid, text, usernames, mentions }) {
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

		const room = Rooms.findOneById(rid, { fields: { ...roomAccessAttributes, _id: 1, t: 1, uids: 1 } });

		if (rid && !room) {
			return users;
		}

		const canListOutsiders = hasAllPermission(userId, ['view-outside-room', 'view-d-room']);
		const canListInsiders = canListOutsiders || (rid && canAccessRoom(room, { _id: userId }));

		// If can't list outsiders and, wether, the rid was not passed or the user has no access to the room, return
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
						_id: {
							$in: Subscriptions.findByRoomId(room._id)
								.fetch()
								.map((s) => s.u?._id)
								.filter((id) => id && id !== userId),
						},
					});
					break;
				default:
					insiderExtraQuery.push({
						__rooms: rid,
					});
					break;
			}
		}

		const searchParams = {
			rid,
			text,
			usernames,
			options,
			users,
			canListOutsiders,
			insiderExtraQuery,
			mentions,
		};

		// Exact match for username only
		if (rid) {
			const exactMatch = Promise.await(
				Users.findOneByUsernameAndRoomIgnoringCase(text, rid, {
					projection: options.projection,
					readPreference: options.readPreference,
				}),
			);
			if (exactMatch) {
				users.push(exactMatch);
				this.processLimitAndUsernames(options, usernames, users);
			}
		}

		if (users.length === 0 && canListOutsiders) {
			const exactMatch = Promise.await(
				Users.findOneByUsernameIgnoringCase(text, {
					projection: options.projection,
					readPreference: options.readPreference,
				}),
			);
			if (exactMatch) {
				users.push(this.mapOutsiders(exactMatch));
				this.processLimitAndUsernames(options, usernames, users);
			}
		}

		// Contains for insiders
		if (this._searchInsiderUsers(searchParams)) {
			return users;
		}

		// Contains for outsiders
		if (this._searchOutsiderUsers(searchParams)) {
			return users;
		}

		if (this._performExtraUserSearches(userId, searchParams)) {
			return users;
		}

		return users;
	}
}
