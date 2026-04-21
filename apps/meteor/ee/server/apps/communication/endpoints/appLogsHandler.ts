import { isAppLogsProps, ajv } from '@rocket.chat/rest-typings';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';

const errorResponse = ajv.compile<{
	success: false;
	error: string;
}>({
	additionalProperties: false,
	type: 'object',
	properties: {
		error: { type: 'string' },
		status: { type: 'string', nullable: true },
		message: { type: 'string', nullable: true },
		success: { type: 'boolean', description: 'Indicates if the request was successful.' },
	},
	required: ['success', 'error'],
});

export const registerAppLogsHandler = ({ api, _manager, _orch }: AppsRestApi) =>
	void api.get(
		':id/logs',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
			query: isAppLogsProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						offset: { type: 'number' },
						logs: { type: 'array' },
						count: { type: 'number' },
						total: { type: 'number' },
						success: { type: 'boolean' },
					},
					required: ['offset', 'logs', 'count', 'total', 'success'],
					additionalProperties: false,
				}),
				400: errorResponse,
				401: errorResponse,
				403: errorResponse,
				404: errorResponse,
			},
		},
		async function action() {
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
	);
