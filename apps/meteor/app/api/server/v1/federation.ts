import { Federation, FederationEE } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { isFederationVerifyMatrixIdProps } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { parse as urlParse } from 'node:url';

import { API } from '../api';
import { settings } from '../../../settings/server';

const federationTesterHost = process.env.FEDERATION_TESTER_HOST?.trim()?.replace(/\/$/, '') || 'https://federationtester.matrix.org';

function checkFederation(): Promise<boolean> {
	const url = urlParse(settings.get('Site_Url'));

	let domain = url.hostname;

	if (url.port) {
		domain += ':' + url.port;
	}

	return new Promise((resolve, reject) =>
		fetch(`${federationTesterHost}/api/federation-ok?server_name=${domain}`)
			.then((response) => response.text())
			.then((text) => resolve(text === 'GOOD'))
			.catch(reject),
	);
}

API.v1.addRoute(
	'federation/matrixIds.verify',
	{
		authRequired: true,
		validateParams: isFederationVerifyMatrixIdProps,
	},
	{
		async get() {
			const { matrixIds } = this.queryParams;

			const federationService = License.hasValidLicense() ? FederationEE : Federation;

			const results = await federationService.verifyMatrixIds(matrixIds);

			return API.v1.success({ results: Object.fromEntries(results) });
		},
	},
);

API.v1.addRoute(
	'federation/configuration.verify',
	{ authRequired: true },
	{
		async get() {
			const service = License.hasValidLicense() ? FederationEE : Federation;

			const status = await service.configurationStatus();

			if (!status.externalReachability.ok || !status.appservice.ok) {
				return API.v1.failure(status);
			}

			return API.v1.success(status);
		},
	},
);
