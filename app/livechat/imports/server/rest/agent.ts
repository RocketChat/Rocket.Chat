import { API } from '../../../../api/server';
import { findAgentDepartments } from '../../../server/api/lib/agents';

interface IUrlParams {
	agentId: string;
}

interface IQueryParams {
	enabledDepartmentsOnly?: string;
}

API.v1.addRoute(
	'livechat/agents/:agentId/departments',
	{ authRequired: true },
	{
		get() {
			const UrlParams: IUrlParams = this.urlParams;
			const QueryParams: IQueryParams = this.queryParams;

			const departments = Promise.await(
				findAgentDepartments({
					userId: this.userId,
					enabledDepartmentsOnly: QueryParams.enabledDepartmentsOnly && QueryParams.enabledDepartmentsOnly === 'true',
					agentId: UrlParams.agentId,
				}),
			);

			return API.v1.success(departments);
		},
	},
);
