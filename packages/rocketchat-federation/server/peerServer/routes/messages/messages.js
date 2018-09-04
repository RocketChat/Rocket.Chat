import express from 'express';
import createGroupSubscriptions from './createGroupSubscriptions';
import createDirectSubscriptions from './createDirectSubscriptions';

const router = express.Router(); /* eslint-disable-line new-cap */

export default function messagesRoutes(app) {
	const self = this;

	app.use('/messages', router);

	router.post('/', async function(req, res) {
		const { identifier } = self.config;

		const {
			body: {
				message,
				sourceUser: { _id: sourceUserId },
				destRoom: peerDestRoom,
				destRoomMembers,
			},
		} = req;

		//
		// Load source user
		const sourceUser = RocketChat.models.Users.findOne({
			_id: sourceUserId,
		});

		//
		// Declare destUser, if needed (direct messages)
		let destUser = null;

		//
		// If it is a direct chat, we need to fix the usernames
		if (peerDestRoom.t === 'd') {
			destUser = RocketChat.models.Users.findOne({
				_id: destRoomMembers[0]._id,
			});

			peerDestRoom.usernames = [sourceUser.username, destUser.username];
		}

		//
		// Upsert the room
		RocketChat.models.Rooms.upsert({ _id: peerDestRoom._id }, peerDestRoom);
		const destRoom = RocketChat.models.Rooms.findOne({ _id: peerDestRoom._id });

		//
		// Handle subscriptions
		if (peerDestRoom.t === 'd') {
			createDirectSubscriptions(destRoom, sourceUser, destUser);
		} else {
			createGroupSubscriptions(identifier, destRoom, destRoomMembers);
		}

		//
		// Make user ts is a Date
		message.ts = new Date(message.ts);

		//
		// Finally, send the message
		RocketChat.sendMessage(sourceUser, message, destRoom, true);

		res.sendStatus(200);
	});
}
