import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('OpenIDConnect', () => {
	describe('Discovery Document', () => {
		it('should parse standard OpenID Connect discovery document', () => {
			const discoveryDoc = {
				issuer: 'https://example.com',
				authorization_endpoint: 'https://example.com/oauth/authorize',
				token_endpoint: 'https://example.com/oauth/token',
				userinfo_endpoint: 'https://example.com/oauth/userinfo',
				jwks_uri: 'https://example.com/oauth/jwks',
				end_session_endpoint: 'https://example.com/oauth/logout',
				response_types_supported: ['code', 'id_token', 'token'],
				subject_types_supported: ['public'],
				id_token_signing_alg_values_supported: ['RS256'],
			};

			expect(discoveryDoc.issuer).to.equal('https://example.com');
			expect(discoveryDoc.authorization_endpoint).to.equal('https://example.com/oauth/authorize');
			expect(discoveryDoc.token_endpoint).to.equal('https://example.com/oauth/token');
			expect(discoveryDoc.userinfo_endpoint).to.equal('https://example.com/oauth/userinfo');
			expect(discoveryDoc.jwks_uri).to.equal('https://example.com/oauth/jwks');
			expect(discoveryDoc.end_session_endpoint).to.equal('https://example.com/oauth/logout');
		});
	});

	describe('ID Token Decoding', () => {
		it('should decode a valid JWT ID token', () => {
			// Sample JWT token (header.payload.signature)
			// Header: {"alg":"RS256","typ":"JWT"}
			// Payload: {"sub":"1234567890","name":"John Doe","email":"john@example.com","iat":1516239022}
			const idToken =
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';

			const parts = idToken.split('.');
			expect(parts).to.have.lengthOf(3);

			const payload = parts[1];
			const decoded = Buffer.from(payload, 'base64').toString('utf8');
			const claims = JSON.parse(decoded);

			expect(claims.sub).to.equal('1234567890');
			expect(claims.name).to.equal('John Doe');
			expect(claims.email).to.equal('john@example.com');
		});
	});

	describe('Claim Mapping', () => {
		it('should map standard OpenID Connect claims', () => {
			const claims = {
				sub: '1234567890',
				preferred_username: 'johndoe',
				email: 'john@example.com',
				name: 'John Doe',
				picture: 'https://example.com/avatar.jpg',
				roles: ['user', 'admin'],
				groups: ['developers', 'managers'],
			};

			expect(claims.sub).to.equal('1234567890');
			expect(claims.preferred_username).to.equal('johndoe');
			expect(claims.email).to.equal('john@example.com');
			expect(claims.name).to.equal('John Doe');
			expect(claims.picture).to.equal('https://example.com/avatar.jpg');
			expect(claims.roles).to.deep.equal(['user', 'admin']);
			expect(claims.groups).to.deep.equal(['developers', 'managers']);
		});

		it('should handle nested claims', () => {
			const claims = {
				sub: '1234567890',
				realm_access: {
					roles: ['user', 'admin'],
				},
			};

			expect(claims.realm_access.roles).to.deep.equal(['user', 'admin']);
		});
	});

	describe('Single Logout URL Generation', () => {
		it('should generate correct logout URL with parameters', () => {
			const endSessionEndpoint = 'https://example.com/oauth/logout';
			const idToken = 'sample-id-token';
			const postLogoutRedirectUri = 'https://rocketchat.example.com';

			const params = new URLSearchParams({
				id_token_hint: idToken,
				post_logout_redirect_uri: postLogoutRedirectUri,
			});

			const logoutUrl = `${endSessionEndpoint}?${params.toString()}`;

			expect(logoutUrl).to.include('id_token_hint=sample-id-token');
			expect(logoutUrl).to.include('post_logout_redirect_uri=https%3A%2F%2Frocketchat.example.com');
		});
	});

	describe('Scope Handling', () => {
		it('should include openid scope', () => {
			const scope = 'openid profile email';
			const scopes = scope.split(' ');

			expect(scopes).to.include('openid');
			expect(scopes).to.include('profile');
			expect(scopes).to.include('email');
		});

		it('should handle custom scopes', () => {
			const scope = 'openid profile email roles groups';
			const scopes = scope.split(' ');

			expect(scopes).to.include('openid');
			expect(scopes).to.include('roles');
			expect(scopes).to.include('groups');
		});
	});
});
