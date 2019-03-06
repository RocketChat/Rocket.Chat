import { Users } from 'meteor/rocketchat:models';
import { API } from 'meteor/rocketchat:api';
import { findGuest, settings, online, findOpenRoom } from '../lib/livechat';
import { Match, check } from 'meteor/check';

API.v1.addRoute('livechat/config', {
	get() {
		try {
			check(this.queryParams, {
				token: Match.Maybe(String),
			});

			const config = settings();
			if (!config.enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const status = online();

			const { token } = this.queryParams;
			const guest = token && findGuest(token);

			let room;
			let agent;

			if (guest) {
				room = findOpenRoom(token);
				agent = room && room.servedBy && Users.getAgentInfo(room.servedBy._id);
			}

			Object.assign(config, { online: status, guest, room, agent });

			return API.v1.success({ config });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
