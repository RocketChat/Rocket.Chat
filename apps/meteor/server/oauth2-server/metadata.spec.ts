import { getAuthorizationServerMetadata, getOAuthIssuer } from './metadata';
import { settings } from '../settings/cached';

jest.mock('../settings/cached', () => ({
	settings: { get: jest.fn() },
}));

describe('getOAuthIssuer', () => {
	it('derives the issuer from the site URL without a trailing slash', () => {
		jest.mocked(settings.get).mockReturnValue('https://chat.example.com/');

		expect(getOAuthIssuer()).toBe('https://chat.example.com');
	});

	it('keeps the path of a workspace served under a prefix', () => {
		jest.mocked(settings.get).mockReturnValue('https://example.com/chat//');

		expect(getOAuthIssuer()).toBe('https://example.com/chat');
	});
});

describe('getAuthorizationServerMetadata', () => {
	it('points every endpoint at the issuer', () => {
		expect(getAuthorizationServerMetadata('https://chat.example.com')).toMatchObject({
			issuer: 'https://chat.example.com',
			authorization_endpoint: 'https://chat.example.com/oauth/authorize',
			token_endpoint: 'https://chat.example.com/oauth/token',
		});
	});

	// The token endpoint requires a client secret, and the library rejects the plain method.
	it('advertises S256 PKCE and secret-based client authentication only', () => {
		expect(getAuthorizationServerMetadata('https://chat.example.com')).toMatchObject({
			code_challenge_methods_supported: ['S256'],
			token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
		});
	});
});
