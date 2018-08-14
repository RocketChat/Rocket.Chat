/* globals SyncedCron */
function removeUsersFromTokenChannels() {
	const rooms = {};

	RocketChat.models.Rooms.findAllTokenChannels().forEach(room => {
		rooms[room._id] = room.tokenpass;
	});

	const users = {};

	RocketChat.models.Subscriptions.findByRoomIds(Object.keys(rooms)).forEach(sub => {
		if (!users[sub.u._id]) {
			users[sub.u._id] = [];
		}
		users[sub.u._id].push(sub.rid);
	});

	Object.keys(users).forEach(user => {
		const userInfo = RocketChat.models.Users.findOneById(user);

		if (userInfo && userInfo.services && userInfo.services.tokenpass) {
			const balances = RocketChat.updateUserTokenpassBalances(userInfo);

			users[user].forEach(roomId => {
				const valid = RocketChat.Tokenpass.validateAccess(rooms[roomId], balances);

				if (!valid) {
					RocketChat.removeUserFromRoom(roomId, userInfo);
				}
			});
		}
	});
}

Meteor.startup(function() {
	Meteor.defer(function() {
		removeUsersFromTokenChannels();

		SyncedCron.add({
			name: 'Remove users from Token Channels',
			schedule: (parser) => parser.cron('0 * * * *'),
			job: removeUsersFromTokenChannels
		});
	});
});
