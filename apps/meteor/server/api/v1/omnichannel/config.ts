import { ajv, GETLivechatConfigRouting, isGETLivechatConfigParams } from '@rocket.chat/rest-typings';
import mem from 'mem';

import { API } from '../..';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent, findGuestWithoutActivity } from './lib/livechat';
import { RoutingManager } from '../../../lib/omnichannel/RoutingManager';
import { online } from '../../../lib/omnichannel/service-status';
import { settings as serverSettings } from '../../../settings';
import type { ExtractRoutesFromAPI } from '../../ApiClass';

const cachedSettings = mem(settings, {
	maxAge: process.env.TEST_MODE === 'true' || process.env.TEST_MODE === 'api' ? 1 : 1000,
	cacheKey: JSON.stringify,
});

const livechatConfigResponseSchema = ajv.compile<{
	config: Record<string, unknown>;
}>({
	type: 'object',
	properties: {
		config: {
			type: 'object',
			additionalProperties: true,
		},
		success: {
			type: 'boolean',
			enum: [true],
		},
	},
	required: ['config', 'success'],
	additionalProperties: false,
});

const livechatConfigEndpoints = API.v1
	.get(
		'livechat/config',
		{
			query: isGETLivechatConfigParams,
			response: {
				200: livechatConfigResponseSchema,
			},
		},
		async function action() {
			const enabled = serverSettings.get<boolean>('Livechat_enabled');

			if (!enabled) {
				return API.v1.success({
					config: { enabled: false },
				});
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
	)
	.get(
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
	// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
	interface Endpoints extends LivechatConfigEndpoints {}
}
