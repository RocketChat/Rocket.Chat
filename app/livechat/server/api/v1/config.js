import { Match, check } from 'meteor/check';

import { API } from '../../../../../server/api';
import { findGuest, settings, online, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';

API.v1.addRoute('livechat/config', {
	get() {
		try {
			check(this.queryParams, {
				token: Match.Maybe(String),
				department: Match.Maybe(String),
			});

			const config = settings();
			if (!config.enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const { token, department } = this.queryParams;
			const status = online(department);
			const guest = token && findGuest(token);

			let room;
			let agent;

			if (guest) {
				room = findOpenRoom(token);
				agent = room && room.servedBy && findAgent(room.servedBy._id);
			}
			const extra = Promise.await(getExtraConfigInfo(room));
			const { config: extraConfig = {} } = extra || {};
			Object.assign(config, { online: status, guest, room, agent }, { ...extraConfig });

			return API.v1.success({ config });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
