import { GETLivechatConfigRouting, isGETLivechatConfigParams } from '@rocket.chat/rest-typings';
import mem from 'mem';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { settings as serverSettings } from '../../../../settings/server';
import { RoutingManager } from '../../lib/RoutingManager';
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
