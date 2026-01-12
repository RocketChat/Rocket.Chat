import { FederationMatrix } from '@rocket.chat/core-services';
import { getFederationRoutes } from '@rocket.chat/federation-matrix';
import { Logger } from '@rocket.chat/logger';
import { GETFederationMatrixIdsVerifyQuerySchema, GETFederationMatrixIdsVerifyResponseSchema } from '@rocket.chat/rest-typings';
import type express from 'express';
import { WebApp } from 'meteor/webapp';

import { API } from '../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../app/api/server/ApiClass';
import { getTrimmedServerVersion } from '../../../app/api/server/lib/getTrimmedServerVersion';

const logger = new Logger('FederationRoutes');

const federationEndpoints = API.v1.get(
	'federation/matrixIds.verify',
	{
		authRequired: true,
		query: GETFederationMatrixIdsVerifyQuerySchema,
		response: {
			200: GETFederationMatrixIdsVerifyResponseSchema,
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

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof federationEndpoints> {}
}
