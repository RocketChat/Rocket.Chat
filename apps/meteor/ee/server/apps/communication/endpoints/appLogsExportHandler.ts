import { isAppLogsExportProps } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { json2csv } from 'json-2-csv';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';

const isErrorResponse = ajv.compile({
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
			enum: [false],
		},
		error: {
			type: 'string',
		},
	},
});

export const registerAppLogsExportHandler = ({ api, _manager, _orch }: AppsRestApi) =>
	void api.get(
		':id/export-logs',
		{
			// authRequired: true,
			// permissionsRequired: ['manage-apps'],
			query: isAppLogsExportProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						body: {
							type: 'string',
							format: 'binary',
							description: 'The content of the exported logs file, either in JSON or CSV format.',
						},
					},
				}),
				400: isErrorResponse,
				404: isErrorResponse,
			},
		},

		async function () {
			const proxiedApp = _manager.getOneById(this.urlParams.id);

			if (!proxiedApp) {
				return api.notFound(`No App found by the id of: ${this.urlParams.id}`);
			}

			if (this.queryParams.appId !== this.urlParams.id) {
				return api.notFound(`Invalid query parameter "appId": ${this.queryParams.appId}`);
			}

			const { count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const options = {
				sort: sort || { _updatedAt: -1 },
				skip: 0,
				limit: Math.min(count || 100, 2000),
			};

			let query: ReturnType<typeof makeAppLogsQuery>;

			try {
				query = makeAppLogsQuery({ appId: this.urlParams.id, ...this.queryParams });
			} catch (error) {
				return api.failure({ error: error instanceof Error ? error.message : 'Unknown error' });
			}

			const result = await _orch.getLogStorage().find(query, options);

			if (!result.length) {
				return api.failure({ error: 'No logs found for the specified criteria' });
			}

			let fileContent: Buffer;
			let filename: string;
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

			if (this.queryParams.type === 'json') {
				fileContent = Buffer.from(JSON.stringify(result, null, 2), 'utf8');
				filename = `app-logs-${this.urlParams.id}-${timestamp}.json`;
			} else {
				fileContent = Buffer.from(json2csv(result, { expandNestedObjects: false }), 'utf8');
				filename = `app-logs-${this.urlParams.id}-${timestamp}.csv`;
			}

			return {
				body: fileContent,
				statusCode: 200,
				headers: {
					'Content-Type': 'text/plain',
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Content-Length': fileContent.length.toString(),
				},
			};
		},
	);
