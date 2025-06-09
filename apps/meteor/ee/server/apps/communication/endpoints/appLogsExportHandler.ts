import { isAppLogsExportProps } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';

export const registerAppLogsExportHandler = ({ api, _manager, _orch }: AppsRestApi) =>
	void api.get(
		':id/export-logs',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
			query: isAppLogsExportProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						data: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									appId: { type: 'string' },
									level: { type: 'string' },
									message: { type: 'string' },
									timestamp: { type: 'string' },
									data: { type: 'object' },
								},
								required: ['id', 'appId', 'level', 'message', 'timestamp', 'data'],
							},
						},
					},
					required: ['data'],
				}),
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
				limit: count || 0, // 0 means no limit, get all logs
			};

			let query: Record<string, any>;

			try {
				query = makeAppLogsQuery({ appId: this.urlParams.id, ...this.queryParams });
			} catch (error) {
				return api.failure({ error: error instanceof Error ? error.message : 'Unknown error' });
			}

			const result = await _orch.getLogStorage().find(query, options);

			if (!result.logs || result.logs.length === 0) {
				return api.failure({ error: 'No logs found for the specified criteria' });
			}

			let fileContent: Buffer;
			let contentType: string;
			let filename: string;
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

			if (this.queryParams.type === 'json') {
				const jsonData = {
					appId: this.urlParams.id,
					exportedAt: new Date().toISOString(),
					totalLogs: result.logs.length,
					logs: result.logs,
				};
				fileContent = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf8');
				contentType = 'application/json';
				filename = `app-logs-${this.urlParams.id}-${timestamp}.json`;
			} else {
				// plain_text format
				const textLines = [
					`App Logs Export for App ID: ${this.urlParams.id}`,
					`Exported at: ${new Date().toISOString()}`,
					`Total logs: ${result.logs.length}`,
					'',
					'---',
					'',
				];

				result.logs.forEach((log, index) => {
					textLines.push(`Log ${index + 1}:`);
					textLines.push(`  Date: ${log._updatedAt || 'N/A'}`);
					textLines.push(`  App ID: ${log.appId || 'N/A'}`);
					textLines.push(`  Method: ${log.method || 'N/A'}`);

					if (log.entries && Array.isArray(log.entries)) {
						log.entries.forEach((entry, entryIndex) => {
							textLines.push(`  Entry ${entryIndex + 1}:`);
							textLines.push(`    Severity: ${entry.severity || 'N/A'}`);
							textLines.push(`    Caller: ${entry.caller || 'N/A'}`);
							textLines.push(`    Message: ${Array.isArray(entry.args) ? entry.args.join(' ') : entry.args || 'N/A'}`);
						});
					}

					textLines.push('');
					textLines.push('---');
					textLines.push('');
				});

				fileContent = Buffer.from(textLines.join('\n'), 'utf8');
				contentType = 'text/plain';
				filename = `app-logs-${this.urlParams.id}-${timestamp}.txt`;
			}

			// Set response headers for file download
			this.response.setHeader('Content-Type', contentType);
			this.response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
			this.response.setHeader('Content-Length', fileContent.length.toString());

			return api.success({ data: { items: [] } });
		},
	);
