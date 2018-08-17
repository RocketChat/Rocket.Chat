import livechat from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/config', {
	get() {
		const config = livechat.settings();
		if (!config.enabled) {
			return RocketChat.API.v1.success({ config: { enabled: false } });
		}

		const online = livechat.online();
		Object.assign(config, { online });
		return RocketChat.API.v1.success({ config });
	},
});

RocketChat.API.v1.addRoute('livechat/config/:visitorToken', {
	get() {
		const config = livechat.settings();
		if (!config.enabled) {
			return RocketChat.API.v1.success({ config: { enabled: false } });
		}

		const online = livechat.online();
		const visitor = livechat.visitor(this.urlParams.visitorToken);
		const room = livechat.room(this.urlParams.visitorToken);
		const agent = room && room.servedBy && RocketChat.models.Users.getAgentInfo(room.servedBy._id);

		Object.assign(config, { online, visitor, room, agent });

		return RocketChat.API.v1.success({ config });
	},
});
