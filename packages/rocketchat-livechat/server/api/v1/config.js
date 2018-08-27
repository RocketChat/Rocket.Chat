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

RocketChat.API.v1.addRoute('livechat/config/:token', {
	get() {
		const config = livechat.settings();
		if (!config.enabled) {
			return RocketChat.API.v1.success({ config: { enabled: false } });
		}

		const online = livechat.online();
		const guest = livechat.guest(this.urlParams.token);
		const room = livechat.room(this.urlParams.token);
		const agent = room && room.servedBy && RocketChat.models.Users.getAgentInfo(room.servedBy._id);

		Object.assign(config, { online, guest, room, agent });

		return RocketChat.API.v1.success({ config });
	},
});
