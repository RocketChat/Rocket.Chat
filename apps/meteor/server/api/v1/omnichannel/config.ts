import { GETLivechatConfigRouting, isGETLivechatConfigParams } from '@rocket.chat/rest-typings';
import mem from 'mem';

import { API } from '../..';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent, findGuestWithoutActivity } from './lib/livechat';
import { RoutingManager } from '../../../../app/livechat/server/lib/RoutingManager';
import { online } from '../../../../app/livechat/server/lib/service-status';
import { settings as serverSettings } from '../../../../app/settings/server';
import type { ExtractRoutesFromAPI } from '../../ApiClass';

const cachedSettings = mem(settings, {
	maxAge: process.env.TEST_MODE === 'true' || process.env.TEST_MODE === 'api' ? 1 : 1000,
	cacheKey: JSON.stringify,
});

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
				token ? findGuestWithoutActivity(token) : null,
			]);

			const room = guest ? await findOpenRoom(guest.token, undefined, this.userId) : undefined;
			const agentPromise = room?.servedBy ? findAgent(room.servedBy._id) : null;
			const extraInfoPromise = getExtraConfigInfo({ room });

			const [agent, extraInfo] = await Promise.all([agentPromise, extraInfoPromise]);

			return API.v1.success({
				config: { ...config, online: status, ...extraInfo, ...(guest && { guest }), ...(room && { room }), ...(agent && { agent }) },
			});
		},
	},
);

const livechatConfigEndpoints = API.v1.get(
	'livechat/config/routing',
	{
		response: {
			200: GETLivechatConfigRouting,
		},
		authRequired: true,
	},
	async function action() {
		const config = RoutingManager.getConfig();

		return API.v1.success({ config });
	},
);

type LivechatConfigEndpoints = ExtractRoutesFromAPI<typeof livechatConfigEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatConfigEndpoints {}
}
