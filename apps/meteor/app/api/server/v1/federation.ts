import { isFederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';
import { Federation, FederationEE } from '@rocket.chat/core-services';

import { isEnterprise } from '../../../../ee/app/license/server';
import { API } from '../api';

API.v1.addRoute(
	'federation/matrixId.verify',
	{
		authRequired: true,
		validateParams: isFederationVerifyMatrixIdProps,
	},
	{
		async get() {
			const { matrixId } = this.queryParams;

			const federationService = isEnterprise() ? FederationEE : Federation;

			const result = await federationService.verifyMatrixId(matrixId);

			return API.v1.success({ result });
		},
	},
);
