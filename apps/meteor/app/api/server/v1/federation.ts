import { Federation, FederationEE } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { isFederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { VerificationStatus } from '../../../../server/services/federation/infrastructure/matrix/helpers/MatrixIdVerificationTypes';
import { getFederationVersion } from '../../../../server/services/federation/utils';
import { API } from '../api';

API.v1
	.get(
		'federation/matrixIds.verify',
		{
			authRequired: true,
			query: isFederationVerifyMatrixIdProps,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						results: {
							type: 'object',
							patternProperties: {
								'^[a-zA-Z0-9_-]+$': {
									type: 'string',
								},
							},
							additionalProperties: false,
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['results', 'success'],
				}),
			},
		},
		async function () {
			const { matrixIds } = this.queryParams;

			const federationVersion = getFederationVersion();
			if (federationVersion === 'native') {
				return API.v1.success({
					results: Object.fromEntries(matrixIds.map((id) => [id, VerificationStatus.UNABLE_TO_VERIFY])),
					success: true,
				});
			}

			const federationService = License.hasValidLicense() ? FederationEE : Federation;

			const results = await federationService.verifyMatrixIds(matrixIds);

			return API.v1.success({ results: Object.fromEntries(results) });
		},
	)
	.get(
		'federation/configuration.verify',
		{
			authRequired: true,
			permissionsRequired: ['view-privileged-setting'],
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						externalReachability: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] },
						appservice: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] },
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['externalReachability', 'appservice', 'success'],
				}),
				400: ajv.compile({
					type: 'object',
					properties: {
						externalReachability: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] },
						appservice: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] },
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['externalReachability', 'appservice', 'success'],
				}),
			},
		},
		async () => {
			const service = License.hasValidLicense() ? FederationEE : Federation;

			const status = await service.configurationStatus();

			if (!status.externalReachability.ok || !status.appservice.ok) {
				return API.v1.failure(status);
			}
			return API.v1.success(status);
		},
	);
