import { FederationMatrix } from '@rocket.chat/core-services';
import { getFederationRoutes } from '@rocket.chat/federation-matrix';
import { Logger } from '@rocket.chat/logger';
import { ajv } from '@rocket.chat/rest-typings';
import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { API } from '../../../app/api/server';
import { getTrimmedServerVersion } from '../../../app/api/server/lib/getTrimmedServerVersion';

const logger = new Logger('FederationRoutes');

API.v1.get(
	'/federation/matrixIds.verify',
	{
		authRequired: true,
		query: ajv.compile<{
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

		(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(routes.matrix.router).use(routes.wellKnown.router);
	} catch (error) {
		logger.error({ msg: '[Federation] Failed to register routes:', err: error });
		throw error;
	}
}
