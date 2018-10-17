export default function eventsRoutes() {
	const self = this;

	RocketChat.API.v1.addRoute('federation.events', { authRequired: false }, {
		post() {
			const {
				event: e,
			} = this.bodyParams;

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
				RocketChat.API.v1.success();
			} catch (err) {
				self.log(`Error handling event:${ e.t } - ${ err.toString() }`);

				RocketChat.API.v1.failure(err);
			}
		},
	});
}
