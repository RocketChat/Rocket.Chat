import { isFederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';
import { Federation } from '@rocket.chat/core-services';

import { API } from '../api';

API.v1.addRoute(
	'federation/verifyMatrixId',
	{
		authRequired: true,
		validateParams: isFederationVerifyMatrixIdProps,
	},
	{
		async get() {
			const { matrixId } = this.queryParams;

			const result = await Federation.verifyMatrixId(matrixId);

			return API.v1.success({ result });
		},
	},
);
