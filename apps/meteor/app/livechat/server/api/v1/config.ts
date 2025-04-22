import { isGETLivechatConfigParams } from '@rocket.chat/rest-typings';
import mem from 'mem';

import { API } from '../../../../api/server';
import { settings as serverSettings } from '../../../../settings/server';
import { online } from '../../lib/service-status';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent, findGuestWithoutActivity } from '../lib/livechat';

const cachedSettings = mem(settings, { maxAge: process.env.TEST_MODE === 'true' ? 1 : 1000, cacheKey: JSON.stringify });

API.v1.addRoute(
	'livechat/config',
	{ validateParams: isGETLivechatConfigParams },
	{
		async get() {
			const enabled = serverSettings.get<boolean>('Livechat_enabled');

			if (!enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const { token, department, businessUnit } = this.queryParams;
			const [config, status, guest] = await Promise.all([
				cachedSettings({ businessUnit }),
				online(department),
				token ? await findGuestWithoutActivity(token) : null,
			]);

			if (!guest) {
				return API.v1.success({ config: { ...config, online: status } });
			}

			const room = await findOpenRoom(guest.token);
			const [agent, extraInfo] = await Promise.all([room?.servedBy ? findAgent(room.servedBy._id) : null, getExtraConfigInfo(room)]);

			return API.v1.success({
				config: { ...config, online: status, guest, ...extraInfo, ...(room && { room }), ...(agent && { agent }) },
			});
		},
	},
);
