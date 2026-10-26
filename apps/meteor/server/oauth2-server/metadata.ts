import { settings } from '../settings/cached';

/** The issuer identifier (RFC 8414) of this workspace's authorization server, which is also the base of its endpoints. */
export const getOAuthIssuer = (): string => settings.get<string>('Site_Url').replace(/\/+$/, '');

/** The authorization server metadata (RFC 8414) served at `/.well-known/oauth-authorization-server`. */
export const getAuthorizationServerMetadata = (issuer: string) => ({
	issuer,
	authorization_endpoint: `${issuer}/oauth/authorize`,
	token_endpoint: `${issuer}/oauth/token`,
	response_types_supported: ['code'],
	grant_types_supported: ['authorization_code', 'refresh_token'],
	token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
	code_challenge_methods_supported: ['S256'],
});
