import { isGETLivechatConfigParams } from '@rocket.chat/rest-typings';
import mem from 'mem';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/LivechatTyped';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent } from '../lib/livechat';

const cachedSettings = mem(settings, { maxAge: 1000, cacheKey: JSON.stringify });

API.v1.addRoute(
	'livechat/config',
	{ validateParams: isGETLivechatConfigParams },
	{
		async get() {
			const enabled = Livechat.enabled();

			if (!enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const { token, department, businessUnit } = this.queryParams;

			const config = await cachedSettings({ businessUnit });

			const status = await Livechat.online(department);
			const guest = token ? await Livechat.findGuest(token) : null;

			const room = guest ? await findOpenRoom(guest.token) : undefined;
			const agent = guest && room && room.servedBy && (await findAgent(room.servedBy._id));

			const extra = await getExtraConfigInfo(room);
			return API.v1.success({
				config: { ...config, online: status, ...extra, ...(guest && { guest }), ...(room && { room }), ...(agent && { agent }) },
			});
		},
	},
);
