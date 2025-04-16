import { isAppLogsProps } from '@rocket.chat/rest-typings';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';

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

				const { offset, count } = await getPaginationItems(this.queryParams);
				const { sort } = await this.parseJsonQuery();

				const options = {
					sort: sort || { _updatedAt: -1 },
					skip: offset,
					limit: count,
				};

				const query: Record<string, any> = {
					appId: this.urlParams.id,
				};

				if (this.queryParams.logLevel) {
					const queryLogLevel = Number(this.queryParams.logLevel);
					const logLevel = ['error'];

					if (queryLogLevel >= 1) {
						logLevel.push('warn', 'info', 'log');
					}

					if (queryLogLevel >= 2) {
						logLevel.push('debug', 'success');
					}

					query['entries.severity'] = { $in: logLevel };
				}

				if (this.queryParams.method) {
					query.method = this.queryParams.method;
				}

				if (this.queryParams.startDate) {
					query._updatedAt = {
						$gte: new Date(this.queryParams.startDate),
					};
				}

				if (this.queryParams.endDate) {
					const endDate = new Date(this.queryParams.endDate);
					endDate.setDate(endDate.getDate() + 1);

					if (query._updatedAt?.$gte && query._updatedAt.$gte >= endDate) {
						return api.failure({ error: 'Invalid date range' });
					}

					query._updatedAt = {
						...(query._updatedAt || {}),
						$lte: endDate,
					};
				}

				const result = await _orch.getLogStorage().find(query, options);

				return api.success({ offset, logs: result.logs, count: result.logs.length, total: result.total });
			},
		},
	);
