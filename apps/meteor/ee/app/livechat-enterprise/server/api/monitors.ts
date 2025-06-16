import type { ILivechatMonitor } from '@rocket.chat/core-typings';

import { findMonitors, findMonitorByUsername } from './lib/monitors';
import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';

API.v1.addRoute(
	'livechat/monitors',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-monitors'],
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findMonitors({
					text,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/monitors/:username',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-monitors'],
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { username } = this.urlParams;

			return API.v1.success(
				(await findMonitorByUsername({
					username,
				})) as unknown as ILivechatMonitor,
			);
		},
	},
);
