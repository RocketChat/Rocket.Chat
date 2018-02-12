import s from 'underscore.string';

function fetchRooms(userId, rooms) {
	if (!RocketChat.settings.get('Store_Last_Message') || RocketChat.authz.hasPermission(userId, 'preview-c-room')) {
		return rooms;
	}

	return rooms.map(room => {
		delete room.lastMessage;
		return room;
	});
}

Meteor.methods({
	spotlight(text, usernames, type = {users: true, rooms: true}, rid) {
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');
		const result = {
			users: [],
			rooms: []
		};
		const roomOptions = {
			limit: 5,
			fields: {
				t: 1,
				name: 1,
				lastMessage: 1
			},
			sort: {
				name: 1
			}
		};
		const userId = this.userId;
		if (userId == null) {
			if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
				result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
			}
			return result;
		}
		const userOptions = {
			limit: 5,
			fields: {
				username: 1,
				name: 1,
				status: 1
			},
			sort: {}
		};
		if (RocketChat.settings.get('UI_Use_Real_Name')) {
			userOptions.sort.name = 1;
		} else {
			userOptions.sort.username = 1;
		}

		if (RocketChat.authz.hasPermission(userId, 'view-outside-room')) {
			if (type.users === true && RocketChat.authz.hasPermission(userId, 'view-d-room')) {
				result.users = RocketChat.models.Users.findByActiveUsersExcept(text, usernames, userOptions).fetch();
			}

			if (type.rooms === true && RocketChat.authz.hasPermission(userId, 'view-c-room')) {
				const username = RocketChat.models.Users.findOneById(userId, {
					username: 1
				}).username;

				const searchableRoomTypes = Object.entries(RocketChat.roomTypes.roomTypes)
					.filter((roomType)=>roomType[1].includeInRoomSearch())
					.map((roomType)=>roomType[0]);

				result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypesNotContainingUsername(regex, searchableRoomTypes, username, roomOptions).fetch());
			}
		} else if (type.users === true && rid) {
			const subscriptions = RocketChat.models.Subscriptions.find({
				rid, 'u.username': {
					$regex: regex,
					$nin: [...usernames, Meteor.user().username]
				}
			}, {limit: userOptions.limit}).fetch().map(({u}) => u._id);
			result.users = RocketChat.models.Users.find({_id: {$in: subscriptions}}, {
				fields: userOptions.fields,
				sort: userOptions.sort
			}).fetch();
		}

		return result;
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'spotlight',
	userId(/*userId*/) {
		return true;
	}
}, 100, 100000);
