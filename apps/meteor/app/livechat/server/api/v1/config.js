import { Match, check } from 'meteor/check';
import mem from 'mem';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';

const cachedSettings = mem(settings, { maxAge: 1000, cacheKey: JSON.stringify });

API.v1.addRoute('livechat/config', {
	async get() {
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

		const config = await cachedSettings({ businessUnit });

		const status = Livechat.online(department);
		const guest = token && (await Livechat.findGuest(token));

		const room = guest && findOpenRoom(token);
		const agent = guest && room && room.servedBy && findAgent(room.servedBy._id);

		const extra = await getExtraConfigInfo(room);
		return API.v1.success({
			config: { ...config, online: status, guest, room, agent, ...extra },
		});
	},
});
