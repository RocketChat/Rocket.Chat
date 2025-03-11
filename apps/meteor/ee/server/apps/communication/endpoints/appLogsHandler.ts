import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';

export const registerAppLogsHandler = ({ api, _manager, _orch }: AppsRestApi) =>
	void api.addRoute(
		':id/logs',
		{ authRequired: true, permissionRequired: ['manage-apps'] },
		{
			async get() {
				const proxiedApp = _manager.getOneById(this.urlParams.id);

				if (!proxiedApp) {
					return api.notFound(`No App found by the id of: ${this.urlParams.id}`);
				}

				const { offset, count } = await getPaginationItems(this.queryParams);
				const { sort, query } = await this.parseJsonQuery();

				const ourQuery = Object.assign({}, query, { appId: proxiedApp.getID() });
				const options = {
					sort: sort || { _updatedAt: -1 },
					skip: offset,
					limit: count,
				};

				const result = await _orch.getLogStorage().find(ourQuery, options);

				return api.success({ offset, logs: result.logs, count: result.logs.length, total: result.total });
			},
		},
	);
