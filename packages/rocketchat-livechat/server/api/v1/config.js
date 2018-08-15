//import _ from 'underscore';
import settings from '../lib/settings';

RocketChat.API.v1.addRoute('livechat/config', {
	get() {
		const config = settings.config();
		if (!config.enabled) {
			return RocketChat.API.v1.success({ config: { enabled: false } });
		}

		const online = settings.online();
		Object.assign(config, { online });
		return RocketChat.API.v1.success({ config });
	}
});

RocketChat.API.v1.addRoute('livechat/config/:visitorToken', {
	get() {
		const config = settings.config();
		if (!config.enabled) {
			return RocketChat.API.v1.success({ config: { enabled: false } });
		}

		const online = settings.online();
		const visitor = settings.visitor(this.urlParams.visitorToken);
		const room = settings.room(this.urlParams.visitorToken);
		const agent = room && room.servedBy && RocketChat.models.Users.getAgentInfo(room.servedBy._id);

		Object.assign(config, { online, visitor, room, agent });

		return RocketChat.API.v1.success({ config });
	}
});
