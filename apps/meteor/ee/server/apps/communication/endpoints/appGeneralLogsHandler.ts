import { isAppLogsProps, ajv } from '@rocket.chat/rest-typings';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';

// TODO: this is a very common error response schema. We should find a way to standardize it.
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

export const registerAppGeneralLogsHandler = ({ api, _orch }: AppsRestApi) =>
	void api.get(
		'logs',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
			query: isAppLogsProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						offset: { type: 'number' },
						// TODO: reference a schema for the array items
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

			const result = await _orch.getLogStorage().findPaginated(query, options);

			return api.success({ offset, logs: result.logs, count: result.logs.length, total: result.total });
		},
	);
