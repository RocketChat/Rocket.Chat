import { isAppLogsProps } from '@rocket.chat/rest-typings';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';

export const registerAppGeneralLogsHandler = ({ api, _orch }: AppsRestApi) =>
	void api.addRoute(
		'logs',
		{ authRequired: true, permissionRequired: ['manage-apps'], validateParams: isAppLogsProps },
		{
			async get() {
				const { offset, count } = await getPaginationItems(this.queryParams);
				const { sort } = await this.parseJsonQuery();

				const options = {
					sort: sort || { _updatedAt: -1 },
					skip: offset,
					limit: count,
				};

				let query: Record<string, any>;

				try {
					query = makeAppLogsQuery(this.queryParams);
				} catch (error) {
					return api.failure({ error: error instanceof Error ? error.message : 'Unknown error' });
				}

				const result = await _orch.getLogStorage().find(query, options);

				return api.success({ offset, logs: result.logs, count: result.logs.length, total: result.total });
			},
		},
	);
