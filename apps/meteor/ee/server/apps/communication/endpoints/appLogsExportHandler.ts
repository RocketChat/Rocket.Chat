import type { IUser } from '@rocket.chat/core-typings';
import { isAppLogsExportProps } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { parse } from 'cookie';
import { json2csv } from 'json-2-csv';

import type { AppsRestApi } from '../rest';
import { makeAppLogsQuery } from './lib/makeAppLogsQuery';
import { APIClass } from '../../../../../app/api/server/ApiClass';

const isErrorResponse = ajv.compile<{
	success: false;
	error: string;
}>({
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

class ExportHandlerAPI extends APIClass {
	protected async authenticatedRoute(req: Request): Promise<IUser | null> {
		const { rc_uid, rc_token } = parse(req.headers.get('cookie') || '');

		if (rc_uid) {
			req.headers.set('x-user-id', rc_uid);
		}

		if (rc_token) {
			req.headers.set('x-auth-token', rc_token);
		}

		return super.authenticatedRoute(req);
	}
}

const adhocApi = new ExportHandlerAPI({
	useDefaultAuth: false,
	prettyJson: process.env.NODE_ENV !== 'development',
});

export const registerAppLogsExportHandler = ({ api, _manager, _orch }: AppsRestApi) => {
	adhocApi.get(
		':id/export-logs',
		{
			authRequired: true,
			permissionsRequired: ['manage-apps'],
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
				401: isErrorResponse,
				404: isErrorResponse,
			},
		},

		async function () {
			const proxiedApp = _manager.getOneById(this.urlParams.id);

			if (!proxiedApp) {
				return api.notFound(`No App found by the id of: ${this.urlParams.id}`);
			}

			let count = 100;

			if (this.queryParams.count !== undefined && this.queryParams.count !== null) {
				count = parseInt(String(this.queryParams.count || 100));
			}

			const { sort } = await this.parseJsonQuery();

			const options = {
				sort: sort || { _updatedAt: -1 },
				skip: 0,
				limit: Math.min(count, 2000),
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
				fileContent = Buffer.from(json2csv(result, { expandArrayObjects: true }), 'utf8');
				filename = `app-logs-${this.urlParams.id}-${timestamp}.csv`;
			}

			return {
				body: fileContent,
				statusCode: 200,
				headers: {
					// 'application/json' here creates problems down the line with the router
					'Content-Type': 'text/plain',
					'Content-Disposition': `attachment; filename="${filename}"`,
					'Content-Length': fileContent.length.toString(),
				},
			};
		},
	);

	api.router.use(adhocApi.router);
};
