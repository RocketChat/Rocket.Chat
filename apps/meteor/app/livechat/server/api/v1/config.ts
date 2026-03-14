import type { ILivechatAgent, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { ajv, GETLivechatConfigRouting, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';
import mem from 'mem';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { settings as serverSettings } from '../../../../settings/server/index';
import { RoutingManager } from '../../lib/RoutingManager';
import { online } from '../../lib/service-status';
import { settings, findOpenRoom, getExtraConfigInfo, findAgent, findGuestWithoutActivity } from '../lib/livechat';

type GETLivechatConfigParams = {
	token?: string;
	department?: string;
	businessUnit?: string;
};

const GETLivechatConfigParamsSchema = {
	type: 'object',
	properties: {
		token: {
			type: 'string',
			nullable: true,
		},
		department: {
			type: 'string',
			nullable: true,
		},
		businessUnit: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

const isGETLivechatConfigParams = ajv.compile<GETLivechatConfigParams>(GETLivechatConfigParamsSchema);

const cachedSettings = mem(settings, { maxAge: process.env.TEST_MODE === 'true' ? 1 : 1000, cacheKey: JSON.stringify });

const livechatConfigEndpoints = API.v1
	.get(
		'livechat/config',
		{
			query: isGETLivechatConfigParams,
			response: {
				200: ajv.compile<{
					config: { [k: string]: string | boolean } & { room?: IOmnichannelRoom; agent?: ILivechatAgent; guest?: ILivechatVisitor };
					success: boolean;
				}>({
					type: 'object',
					properties: {
						config: {
							type: 'object',
							properties: {
								room: { $ref: '#/components/schemas/IOmnichannelRoom' },
								agent: { $ref: '#/components/schemas/ILivechatAgent' },
								guest: { $ref: '#/components/schemas/ILivechatVisitor' },
							},
							additionalProperties: true,
						},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['config', 'success'],
				}),
			},
		},
		async function action() {
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
	)
	.get(
		'livechat/config/routing',
		{
			authRequired: true,
			response: {
				200: GETLivechatConfigRouting,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const config = RoutingManager.getConfig();

			return API.v1.success({ config });
		},
	);

type LivechatConfigEndpoints = ExtractRoutesFromAPI<typeof livechatConfigEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatConfigEndpoints { }
}
