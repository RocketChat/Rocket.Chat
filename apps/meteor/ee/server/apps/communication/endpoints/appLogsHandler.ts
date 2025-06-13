import { isAppLogsProps } from '@rocket.chat/rest-typings';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';

export const registerAppLogsHandler = ({ api, _manager, _orch }: AppsRestApi) =>
	void api.addRoute(
		':id/logs',
		{ authRequired: true, permissionRequired: ['manage-apps'], validateParams: isAppLogsProps },
		{
			async get() {
				const proxiedApp = _manager.getOneById(this.urlParams.id);

				if (!proxiedApp) {
					return api.notFound(`No App found by the id of: ${this.urlParams.id}`);
				}

				if (this.queryParams.appId && this.queryParams.appId !== this.urlParams.id) {
					return api.notFound(`Invalid query parameter "appId": ${this.queryParams.appId}`);
				}

				const { offset, count } = await getPaginationItems(this.queryParams);
				const { sort } = await this.parseJsonQuery();

				const options = {
					sort: sort || { _updatedAt: -1 },
					skip: offset,
					limit: count,
				};

				let query: Record<string, any>;

				try {
					query = makeAppLogsQuery({ appId: this.urlParams.id, ...this.queryParams });
				} catch (error) {
					return api.failure({ error: error instanceof Error ? error.message : 'Unknown error' });
				}

				const result = await _orch.getLogStorage().findPaginated(query, options);

				return api.success({ offset, logs: result.logs, count: result.logs.length, total: result.total });
			},
		},
	);
