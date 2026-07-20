import {
	ajv,
	isSamlParseMetadata,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { SamlParseMetadataResult } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../lib/logger/system';
import { parseIdpMetadata } from '../../lib/saml/lib/parsers/IdpMetadata';
import { settings } from '../../settings';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const parseMetadataResponse = ajv.compile<SamlParseMetadataResult & { success: true }>({
	type: 'object',
	properties: {
		entryPoint: { type: 'string' },
		idpSLORedirectURL: { type: 'string' },
		cert: { type: 'string' },
		identifierFormat: { type: 'string' },
		warnings: { type: 'array', items: { type: 'string' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['warnings', 'success'],
	additionalProperties: false,
});

const samlEndpoints = API.v1.post(
	'saml.parseMetadata',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		body: isSamlParseMetadata,
		response: {
			200: parseMetadataResponse,
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
			SystemLogger.error({ msg: 'Failed to fetch SAML IdP metadata', err });
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
			if (err instanceof Error && (err as { type?: string }).type === 'max-size') {
				return API.v1.failure('SAML_Metadata_too_large');
			}
			return API.v1.failure('SAML_Metadata_fetch_failed');
		}

		try {
			const { warnings, ...values } = parseIdpMetadata(xml);
			return API.v1.success({ ...values, warnings });
		} catch (err) {
			return API.v1.failure('SAML_Metadata_invalid');
		}
	},
);

export type SAMLEndpoints = ExtractRoutesFromAPI<typeof samlEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends SAMLEndpoints {}
}
