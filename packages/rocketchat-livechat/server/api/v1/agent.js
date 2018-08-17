import livechat from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/agent/:roomId/:visitorToken', {
	get() {
		try {
			check(this.urlParams, {
				roomId: String,
				visitorToken: String,
			});

			const room = livechat.room(this.urlParams.visitorToken, this.urlParams.roomId);
			const agent = room && room.servedBy && livechat.agent(room.servedBy._id);
			return RocketChat.API.v1.success({ agent });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});
