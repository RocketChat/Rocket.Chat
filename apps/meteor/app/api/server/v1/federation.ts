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
	'federation.verifyConfiguration',
	{ authRequired: false },
	{
		async get() {
			const federationService = License.hasValidLicense() ? FederationEE : Federation;

			const response = {
				appservice: { duration_ms: -1, ok: false },
				federation: {
					ok: false,
				},
			};

			try {
				response.federation.ok = await checkFederation();
			} catch (error) {
				return API.v1.failure({
					federation: {
						ok: false,
						error: String(error),
					},
				});
			}

			try {
				response.appservice = await federationService.verifyConfiguration();
				response.appservice.ok = true;
			} catch (error) {
				return API.v1.failure({
					federation: response.federation,
					appservice: {
						error: String(error),
					},
				});
			}

			if (response.federation.ok) {
				return API.v1.success(response);
			} else {
				return API.v1.failure(response);
			}
		},
	},
);
