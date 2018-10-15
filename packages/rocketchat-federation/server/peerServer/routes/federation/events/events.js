import express from 'express';

const router = express.Router(); /* eslint-disable-line new-cap */

export default function eventsRoutes(app) {
	const self = this;

	app.use('/events', router);

	router.post('/', async function(req, res) {
		const {
			event: e,
		} = req.body;

		self.log(`Received event:${ e.t }`);

		try {
			switch (e.t) {
				case 'rc':
					self.handleRoomCreatedEvent(e);
					break;
				case 'dc':
					self.handleDirectRoomCreatedEvent(e);
					break;
				case 'uj':
					self.handleUserJoinedRoomEvent(e);
					break;
				case 'ua':
					self.handleUserAddedToRoomEvent(e);
					break;
				case 'ul':
					self.handleUserLeftRoomEvent(e);
					break;
				case 'ur':
					self.handleUserRemovedFromRoomEvent(e);
					break;
				case 'ms':
					self.handleMessageSentEvent(e);
					break;
			}

			// Respond
			res.sendStatus(202);
		} catch (err) {
			self.log(`Error handling event:${ e.t } - ${ err.toString() }`);

			res.sendStatus(400);
		}
	});
}
