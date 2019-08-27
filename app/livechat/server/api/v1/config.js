import { Match, check } from 'meteor/check';

import { Users } from '../../../../models';
import { API } from '../../../../api';
import { findGuest, findSession, settings, online, findOpenRoom, getExtraConfigInfo } from '../lib/livechat';

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

			const session = findSession(token);
			const extraConfig = room && Promise.await(getExtraConfigInfo(room));
			Object.assign(config, { online: status, guest, room, agent, session }, extraConfig);

			return API.v1.success({ config });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
