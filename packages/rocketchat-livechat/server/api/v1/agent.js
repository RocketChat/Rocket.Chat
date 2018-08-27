import livechat from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/agent/:rid/:token', {
	get() {
		try {
			check(this.urlParams, {
				rid: String,
				token: String,
			});

			const room = livechat.room(this.urlParams.token, this.urlParams.rid);
			const agent = room && room.servedBy && livechat.agent(room.servedBy._id);
			return RocketChat.API.v1.success({ agent });
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});
