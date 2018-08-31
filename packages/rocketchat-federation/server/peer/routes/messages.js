import { createRoom } from '../createRoom';

function messagesRoutes(router) {
	router.post('/message', async function(req, res) {
		const {
			body: { message, fromUser, toUser },
		} = req;

		const userFrom = RocketChat.models.Users.findOne({
			_id: fromUser._id,
		});
		const userTo = RocketChat.models.Users.findOne({ _id: toUser._id });

		if (!userFrom || !userTo) {
			return;
		}

		const roomIds = [
			`${ userFrom._id }${ userTo._id }`,
			`${ userTo._id }${ userFrom._id }`,
		];

		let room = RocketChat.models.Rooms.findOne({ _id: { $in: roomIds } });

		if (!room) {
			room = createRoom(userFrom, userTo);
		}

		delete message.rid;
		message.ts = new Date(message.ts);

		RocketChat.sendMessage(fromUser, message, room, true);

		res.sendStatus(200);
	});
}

export default messagesRoutes;
