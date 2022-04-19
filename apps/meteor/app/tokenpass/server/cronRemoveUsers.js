import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { updateUserTokenpassBalances } from './functions/updateUserTokenpassBalances';
import { Tokenpass } from './Tokenpass';
import { Rooms, Subscriptions, Users } from '../../models';
import { removeUserFromRoom } from '../../lib/server/functions/removeUserFromRoom';

function removeUsersFromTokenChannels() {
	const rooms = {};

	Rooms.findAllTokenChannels().forEach((room) => {
		rooms[room._id] = room.tokenpass;
	});

	const users = {};

	Subscriptions.findByRoomIds(Object.keys(rooms)).forEach((sub) => {
		if (!users[sub.u._id]) {
			users[sub.u._id] = [];
		}
		users[sub.u._id].push(sub.rid);
	});

	Object.keys(users).forEach((user) => {
		const userInfo = Users.findOneById(user);

		if (userInfo && userInfo.services && userInfo.services.tokenpass) {
			const balances = updateUserTokenpassBalances(userInfo);

			users[user].forEach((roomId) => {
				const valid = Tokenpass.validateAccess(rooms[roomId], balances);

				if (!valid) {
					Promise.await(removeUserFromRoom(roomId, userInfo));
				}
			});
		}
	});
}

Meteor.startup(function () {
	Meteor.defer(function () {
		removeUsersFromTokenChannels();

		SyncedCron.add({
			name: 'Remove users from Token Channels',
			schedule: (parser) => parser.cron('0 * * * *'),
			job: removeUsersFromTokenChannels,
		});
	});
});
