import {
	isSamlParseMetadata,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateSamlParseMetadataSuccessResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { FetchError, serverFetch as fetch } from '@rocket.chat/server-fetch';

import { parseIdpMetadata } from '../../lib/saml/lib/parsers/IdpMetadata';
import { settings } from '../../settings';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const samlEndpoints = API.v1.post(
	'saml.parseMetadata',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		body: isSamlParseMetadata,
		response: {
			200: validateSamlParseMetadataSuccessResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { url } = this.bodyParams;

		let response;
		try {
			response = await fetch(
				url,
				{
					ignoreSsrfValidation: false,
					allowList: settings.get<string>('SSRF_Allowlist'),
					timeout: 20_000,
					size: 1_000_000,
					headers: { Accept: 'application/samlmetadata+xml, application/xml, text/xml' },
				},
				settings.get<boolean>('Allow_Invalid_SelfSigned_Certs'),
			);
		} catch (err) {
			this.logger.error({ msg: 'Failed to fetch SAML IdP metadata', err });
			if (err instanceof Error && err.message === 'error-ssrf-validation-failed') {
				return API.v1.failure('SAML_Metadata_url_blocked');
			}
			return API.v1.failure('SAML_Metadata_fetch_failed');
		}

		if (!response.ok) {
			response.body.resume();
			return API.v1.failure('SAML_Metadata_fetch_failed');
		}

		let xml: string;
		try {
			xml = await response.text();
		} catch (err) {
			if (err instanceof FetchError && err.type === 'max-size') {
				return API.v1.failure('SAML_Metadata_too_large');
			}
			return API.v1.failure('SAML_Metadata_fetch_failed');
		}

		try {
			const { warnings, ...values } = parseIdpMetadata(xml);
			return API.v1.success({ ...values, warnings });
		} catch (err) {
			this.logger.warn({ msg: 'Failed to parse SAML IdP metadata', err });
			return API.v1.failure('SAML_Metadata_invalid');
		}
	},
);

export type SAMLEndpoints = ExtractRoutesFromAPI<typeof samlEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends SAMLEndpoints {}
}
