import type { IFederationMatrixService } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { ajv } from '@rocket.chat/rest-typings';
import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { API } from '../../../app/api/server';
import { isRunningMs } from '../../../server/lib/isRunningMs';

const logger = new Logger('FederationRoutes');

let federationService: IFederationMatrixService | undefined;
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
		if (!federationService) {
			throw new Error('Federation service not registered');
		}
		return API.v1.success({
			results: await federationService.verifyMatrixIds(matrixIds),
		});
	},
);

export async function registerFederationRoutes(f: IFederationMatrixService): Promise<void> {
	federationService = f;
	if (isRunningMs()) {
		return;
	}

	try {
		const routes = federationService.getAllRoutes();
		(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(routes.matrix.router).use(routes.wellKnown.router);

		logger.log('[Federation] Registered federation routes');
	} catch (error) {
		logger.error('[Federation] Failed to register routes:', error);
		throw error;
	}
}
