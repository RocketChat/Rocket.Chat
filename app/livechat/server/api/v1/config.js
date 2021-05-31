import { Match, check } from 'meteor/check';

import { Livechat } from '../../lib/Livechat';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';
import { API } from '../../../../../server/api/v1';

API.v1.addRoute('livechat/config', {
	get() {
		try {
			check(this.queryParams, {
				token: Match.Maybe(String),
				department: Match.Maybe(String),
			});
			const enabled = Livechat.enabled();

			if (!enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const config = settings();

			const { token, department } = this.queryParams;
			const status = Livechat.online(department);
			const guest = token && Livechat.findGuest(token);

			const room = guest && findOpenRoom(token);
			const agent = guest && room && room.servedBy && findAgent(room.servedBy._id);

			const extra = Promise.await(getExtraConfigInfo(room));
			const { config: extraConfig = {} } = extra || {};

			return API.v1.success({ config: { ...config, online: status, guest, room, agent, ...extraConfig } });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
