import { Federation, FederationEE } from '@rocket.chat/core-services';
import { isFederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';

import { isEnterprise } from '../../../../ee/app/license/server';
import { API } from '../api';

API.v1.addRoute(
	'federation/matrixIds.verify',
	{
		authRequired: true,
		validateParams: isFederationVerifyMatrixIdProps,
	},
	{
		async get() {
			const { matrixIds } = this.queryParams;

			const federationService = isEnterprise() ? FederationEE : Federation;

			const results = await federationService.verifyMatrixIds(matrixIds);

			return API.v1.success({ results: Object.fromEntries(results) });
		},
	},
);
