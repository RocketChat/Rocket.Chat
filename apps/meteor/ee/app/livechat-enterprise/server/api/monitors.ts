import type { ILivechatMonitor } from '@rocket.chat/core-typings';

import { API } from '../../../../../app/api/server';
import { findMonitors, findMonitorByUsername } from './lib/monitors';

API.v1.addRoute(
	'livechat/monitors',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-monitors'],
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
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
