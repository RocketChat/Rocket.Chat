import { Meteor } from 'meteor/meteor';
import { Rooms, Subscriptions, Users } from '/app/models';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import { updateUserTokenpassBalances } from './functions/updateUserTokenpassBalances';
import { Tokenpass } from './Tokenpass';

async function removeUsersFromTokenChannels() {
	const rooms = {};
	const { removeUserFromRoom } = await import('/app/lib');

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
					removeUserFromRoom(roomId, userInfo);
				}
			});
		}
	});
}

Meteor.startup(function() {
	Meteor.defer(async function() {
		await removeUsersFromTokenChannels();

		SyncedCron.add({
			name: 'Remove users from Token Channels',
			schedule: (parser) => parser.cron('0 * * * *'),
			job: removeUsersFromTokenChannels,
		});
	});
});
