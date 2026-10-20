import { getOpenIdTokenSubject, issueOpenIdToken } from './openid';

describe('MatrixRTC OpenID provider', () => {
	it('issues a bearer token that names this server and resolves to the user it was issued for', () => {
		const token = issueOpenIdToken('@alice:rc1', 'rc1');

		expect(token).toEqual({ access_token: expect.any(String), token_type: 'Bearer', matrix_server_name: 'rc1', expires_in: 3600 });
		expect(getOpenIdTokenSubject(token.access_token)).toBe('@alice:rc1');
	});

	it('issues a different token every time, even for the same user', () => {
		expect(issueOpenIdToken('@alice:rc1', 'rc1').access_token).not.toBe(issueOpenIdToken('@alice:rc1', 'rc1').access_token);
	});

	it('does not recognize a token it never issued', () => {
		expect(getOpenIdTokenSubject('forged')).toBeUndefined();
	});

	it('stops vouching for a token once it expires', () => {
		const now = Date.now();
		const { access_token: accessToken, expires_in: expiresIn } = issueOpenIdToken('@alice:rc1', 'rc1', now);

		expect(getOpenIdTokenSubject(accessToken, now + expiresIn * 1000 - 1)).toBe('@alice:rc1');
		expect(getOpenIdTokenSubject(accessToken, now + expiresIn * 1000)).toBeUndefined();
	});

	it('forgets expired tokens when issuing new ones', () => {
		const now = Date.now();
		const stale = issueOpenIdToken('@alice:rc1', 'rc1', now);

		issueOpenIdToken('@bob:rc1', 'rc1', now + stale.expires_in * 1000);

		// Read back from before the expiry: had it been kept, it would still resolve at that time.
		expect(getOpenIdTokenSubject(stale.access_token, now)).toBeUndefined();
	});
});
