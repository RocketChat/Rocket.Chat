import { isGETLivechatQueueParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { findQueueMetrics } from '../../../server/api/lib/queue';

API.v1.addRoute(
	'livechat/queue',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatQueueParams },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { agentId, includeOfflineAgents, departmentId } = this.queryParams;
			const users = await findQueueMetrics({
				agentId,
				includeOfflineAgents: includeOfflineAgents === 'true',
				departmentId,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(users);
		},
	},
);
