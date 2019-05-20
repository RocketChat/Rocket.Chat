import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasPermission } from '../../app/authorization';
import { Users, Subscriptions, Rooms } from '../../app/models';
import { settings } from '../../app/settings';
import { roomTypes } from '../../app/utils';

function fetchRooms(userId, rooms) {
	if (!settings.get('Store_Last_Message') || hasPermission(userId, 'preview-c-room')) {
		return rooms;
	}

	return rooms.map((room) => {
		delete room.lastMessage;
		return room;
	});
}

Meteor.methods({
	spotlight(text, usernames, type = { users: true, rooms: true }, rid) {
		const searchForChannels = text[0] === '#';
		const searchForDMs = text[0] === '@';
		if (searchForChannels) {
			type.users = false;
			text = text.slice(1);
		}
		if (searchForDMs) {
			type.rooms = false;
			text = text.slice(1);
		}
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');
		const result = {
			users: [],
			rooms: [],
		};
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
		const { userId } = this;
		if (userId == null) {
			if (settings.get('Accounts_AllowAnonymousRead') === true) {
				result.rooms = fetchRooms(userId, Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
			}
			return result;
		}
		const userOptions = {
			limit: 5,
			fields: {
				username: 1,
				name: 1,
				status: 1,
			},
			sort: {},
			filterByDiscoverability: true,
		};
		if (settings.get('UI_Use_Real_Name')) {
			userOptions.sort.name = 1;
		} else {
			userOptions.sort.username = 1;
		}

		if (hasPermission(userId, 'view-outside-room')) {
			if (type.users === true && hasPermission(userId, 'view-d-room')) {
				result.users = Users.findByActiveUsersExcept(text, usernames, userOptions).fetch();
			}

			if (type.rooms === true && hasPermission(userId, 'view-c-room')) {
				const searchableRoomTypes = Object.entries(roomTypes.roomTypes)
					.filter((roomType) => roomType[1].includeInRoomSearch())
					.map((roomType) => roomType[0]);

				const roomIds = Subscriptions.findByUserIdAndTypes(userId, searchableRoomTypes, { fields: { rid: 1 } }).fetch().map((s) => s.rid);
				result.rooms = fetchRooms(userId, Rooms.findByNameAndTypesNotInIds(regex, searchableRoomTypes, roomIds, roomOptions).fetch());
			}
		} else if (type.users === true && rid) {
			const subscriptions = Subscriptions.find({
				rid,
				'u.username': {
					$regex: regex,
					$nin: [...usernames, Meteor.user().username],
				},
			}, { limit: userOptions.limit }).fetch().map(({ u }) => u._id);
			result.users = Users.find({ _id: { $in: subscriptions } }, {
				fields: userOptions.fields,
				sort: userOptions.sort,
			}).fetch();
		}

		return result;
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'spotlight',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
