import { FederationMatrix } from '@rocket.chat/core-services';
import { getFederationRoutes } from '@rocket.chat/federation-matrix';
import { mountRouter } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import { API } from '../../../server/api';
import { getTrimmedServerVersion } from '../../../server/api/lib/getTrimmedServerVersion';
import { httpApp } from '../../../server/lib/http/httpServer';

const logger = new Logger('FederationRoutes');

API.v1.get(
	'/federation/matrixIds.verify',
	{
		authRequired: true,
		query: ajvQuery.compile<{
			matrixIds: string[];
		}>({
			type: 'object',
			properties: {
				matrixIds: { type: 'array', items: { type: 'string' } },
			},
		}),
		response: {
			200: ajv.compile<{
				results: { [key: string]: string };
			}>({
				type: 'object',
				properties: {
					results: { type: 'object', additionalProperties: { type: 'string' } },
				},
			}),
		},
	},
	async function () {
		const { matrixIds } = this.queryParams;
		return API.v1.success({
			results: await FederationMatrix.verifyMatrixIds(matrixIds),
		});
	},
);

export async function registerFederationRoutes(): Promise<void> {
	try {
		const routes = getFederationRoutes(getTrimmedServerVersion());

		mountRouter(httpApp, routes.matrix);
		mountRouter(httpApp, routes.wellKnown);
	} catch (error) {
		logger.error({ msg: '[Federation] Failed to register routes:', err: error });
		throw error;
	}
}
