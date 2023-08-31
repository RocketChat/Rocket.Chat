import { Federation } from '@rocket.chat/core-services';
import { isFederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';

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

			const results = await Federation.verifyMatrixIds(matrixIds);

			return API.v1.success({ results: Object.keys(results).length > 0 ? Object.fromEntries(results) : {} });
		},
	},
);
