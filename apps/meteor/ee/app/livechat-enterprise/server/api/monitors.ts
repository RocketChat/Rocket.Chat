import { ILivechatMonitor } from '@rocket.chat/core-typings';

import { API } from '../../../../../app/api/server';
import { findMonitors, findMonitorByUsername } from './lib/monitors';

API.v1.addRoute(
	'livechat/monitors',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findMonitors({
					userId: this.userId,
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
	{ authRequired: true },
	{
		async get() {
			const { username } = this.urlParams;

			return API.v1.success(
				(await findMonitorByUsername({
					userId: this.userId,
					username,
				})) as unknown as ILivechatMonitor,
			);
		},
	},
);
