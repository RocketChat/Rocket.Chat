import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { License } from '@rocket.chat/license';
import { OAuthApps } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { settings } from '../../../settings/cached';

const GRANT_TYPES = ['authorization_code', 'refresh_token'];
const RESPONSE_TYPES = ['code'];
const SECRET_AUTH_METHODS = ['client_secret_basic', 'client_secret_post'];
const DEFAULT_AUTH_METHOD = 'client_secret_basic';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
// Schemes the browser or the system handles itself, so a code sent to them never reaches a native app (RFC 8252 §7.1).
const NON_APP_SCHEMES = new Set([
	'ftp:',
	'file:',
	'ws:',
	'wss:',
	'javascript:',
	'data:',
	'vbscript:',
	'blob:',
	'about:',
	'mailto:',
	'tel:',
	'sms:',
]);

const MAX_REDIRECT_URIS = 10;
const MAX_REDIRECT_URI_LENGTH = 2048;
const MAX_CLIENT_NAME_LENGTH = 100;

const REGISTRANT = { _id: 'oauth-dynamic-client-registration', username: 'oauth-dynamic-client-registration' };

type ClientMetadataError = {
	error: 'invalid_redirect_uri' | 'invalid_client_metadata';
	error_description: string;
};

type ClientMetadata = {
	redirectUris: string[];
	clientName: string;
	tokenEndpointAuthMethod: string;
};

export type ClientRegistrationResult =
	| {
			statusCode: 201;
			body: {
				client_id: string;
				client_secret: string;
				client_id_issued_at: number;
				client_secret_expires_at: 0;
				client_name: string;
				redirect_uris: string[];
				grant_types: string[];
				response_types: string[];
				token_endpoint_auth_method: string;
			};
	  }
	| { statusCode: 400; body: ClientMetadataError }
	| { statusCode: 403; body: { error: 'access_denied'; error_description: string } };

// Self-registration exists for MCP clients, so it follows MCP's license and switch as well as its own setting.
const isRegistrationAllowed = (): boolean =>
	License.hasModule(AI_LICENSE_MODULE) &&
	settings.get<boolean>('MCP_Enabled') === true &&
	settings.get<boolean>('OAuth2_Allow_Dynamic_Client_Registration') === true;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isListOf = (value: unknown, allowed: string[]): boolean =>
	value === undefined || (Array.isArray(value) && value.every((item) => typeof item === 'string' && allowed.includes(item)));

// Redirect URIs are stored verbatim as one comma-separated string and compared verbatim, and native clients may use
// loopback or private-use schemes (RFC 8252).
const isAcceptableRedirectUri = (uri: unknown): uri is string => {
	if (typeof uri !== 'string' || uri.length > MAX_REDIRECT_URI_LENGTH || /[\s,#]/.test(uri) || !URL.canParse(uri)) {
		return false;
	}

	const { protocol, hostname } = new URL(uri);
	if (protocol === 'https:') {
		return true;
	}
	if (protocol === 'http:') {
		return LOOPBACK_HOSTS.has(hostname);
	}

	return !NON_APP_SCHEMES.has(protocol);
};

const parseClientMetadata = (body: unknown): ClientMetadata | ClientMetadataError => {
	const metadata = isRecord(body) ? body : {};
	const redirectUris = metadata.redirect_uris;

	if (!Array.isArray(redirectUris) || redirectUris.length === 0 || redirectUris.length > MAX_REDIRECT_URIS) {
		return { error: 'invalid_redirect_uri', error_description: `\`redirect_uris\` must list between 1 and ${MAX_REDIRECT_URIS} URIs` };
	}

	if (!redirectUris.every(isAcceptableRedirectUri)) {
		return {
			error: 'invalid_redirect_uri',
			error_description:
				'Each redirect URI must be an https URI, an http loopback URI or a native app URI, without whitespace, a comma or a fragment',
		};
	}

	if (!isListOf(metadata.grant_types, GRANT_TYPES) || !isListOf(metadata.response_types, RESPONSE_TYPES)) {
		return { error: 'invalid_client_metadata', error_description: 'Only the authorization code flow with refresh tokens is supported' };
	}

	const authMethod = metadata.token_endpoint_auth_method ?? DEFAULT_AUTH_METHOD;
	if (typeof authMethod !== 'string' || ![...SECRET_AUTH_METHODS, 'none'].includes(authMethod)) {
		return { error: 'invalid_client_metadata', error_description: '`token_endpoint_auth_method` is not supported' };
	}

	const clientName = typeof metadata.client_name === 'string' ? metadata.client_name.trim() : '';
	if (clientName.length > MAX_CLIENT_NAME_LENGTH) {
		return { error: 'invalid_client_metadata', error_description: `\`client_name\` must not exceed ${MAX_CLIENT_NAME_LENGTH} characters` };
	}

	return {
		redirectUris,
		clientName: (clientName || new URL(redirectUris[0]).host || redirectUris[0]).slice(0, MAX_CLIENT_NAME_LENGTH),
		// Every client of this server is confidential, so one that asks to be public gets a secret instead (RFC 7591 §3.2.1).
		tokenEndpointAuthMethod: authMethod === 'none' ? DEFAULT_AUTH_METHOD : authMethod,
	};
};

/** Registers an OAuth client on the caller's own request (RFC 7591), when the workspace allows it. */
export const registerOAuthClient = async (body: unknown): Promise<ClientRegistrationResult> => {
	if (!isRegistrationAllowed()) {
		return {
			statusCode: 403,
			body: {
				error: 'access_denied',
				error_description:
					'Dynamic Client Registration is not enabled on this workspace. It needs the Rocket.Chat AI add-on with MCP enabled; an administrator can turn it on in the MCP settings, or create an OAuth app and give its client ID and secret to the client.',
			},
		};
	}

	const metadata = parseClientMetadata(body);
	if ('error' in metadata) {
		return { statusCode: 400, body: metadata };
	}

	const clientId = Random.id();
	const clientSecret = Random.secret();
	const createdAt = new Date();

	await OAuthApps.insertOne({
		name: metadata.clientName,
		active: true,
		clientId,
		clientSecret,
		redirectUri: metadata.redirectUris.join(','),
		_createdAt: createdAt,
		_updatedAt: createdAt,
		_createdBy: REGISTRANT,
	});

	return {
		statusCode: 201,
		body: {
			client_id: clientId,
			client_secret: clientSecret,
			client_id_issued_at: Math.floor(createdAt.getTime() / 1000),
			client_secret_expires_at: 0,
			client_name: metadata.clientName,
			redirect_uris: metadata.redirectUris,
			grant_types: GRANT_TYPES,
			response_types: RESPONSE_TYPES,
			token_endpoint_auth_method: metadata.tokenEndpointAuthMethod,
		},
	};
};
