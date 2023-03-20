import { isGETLivechatQueueParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { findQueueMetrics } from '../../../server/api/lib/queue';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { parseJsonQuery } from '../../../../api/server/helpers/parseJsonQuery';

API.v1.addRoute(
	'livechat/queue',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatQueueParams },
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
