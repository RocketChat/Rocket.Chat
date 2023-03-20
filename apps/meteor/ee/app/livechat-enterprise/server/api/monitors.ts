import type { ILivechatMonitor } from '@rocket.chat/core-typings';

import { API } from '../../../../../app/api/server';
import { findMonitors, findMonitorByUsername } from './lib/monitors';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { parseJsonQuery } from '../../../../../app/api/server/helpers/parseJsonQuery';

API.v1.addRoute(
	'livechat/monitors',
	{
		authRequired: true,
		permissionsRequired: ['manage-livechat-monitors'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await parseJsonQuery(
				this.request.route,
				this.userId,
				this.queryParams,
				this.logger,
				this.queryFields,
				this.queryOperations,
			);
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
