import { isGETLivechatQueueParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { findQueueMetrics } from '../../../server/api/lib/queue';

API.v1.addRoute(
	'livechat/queue',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatQueueParams },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { agentId, includeOfflineAgents, departmentId } = this.requestParams();
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
