import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';

API.v1.addRoute('livechat/config', {
	async get() {
		try {
			check(this.queryParams, {
				token: Match.Maybe(String),
				department: Match.Maybe(String),
				businessUnit: Match.Maybe(String),
			});
			const enabled = Livechat.enabled();

			if (!enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const { token, department, businessUnit } = this.queryParams;

			const config = await settings({ businessUnit });

			const status = Livechat.online(department);
			const guest = token && Livechat.findGuest(token);

			const room = guest && findOpenRoom(token);
			const agent = guest && room && room.servedBy && findAgent(room.servedBy._id);

			const extra = await getExtraConfigInfo(room);
			return API.v1.success({
				config: { ...config, online: status, guest, room, agent, ...extra },
			});
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
