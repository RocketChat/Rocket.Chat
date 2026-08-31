import { readFileSync } from 'fs';
import { join } from 'path';

import { APIError } from './APIError';
import { Strategy } from './Strategy';
import type { Profile } from './profile';

function loadFixture(relativePath: string): string {
	return readFileSync(join(__dirname, '__fixtures__', relativePath), 'utf8');
}

const defaultOptions = {
	consumerKey: 'ABC123',
	consumerSecret: 'secret',
	callbackURL: 'http://www.example.test/callback',
};

function noop() {
	// verify callback placeholder
}

function getUserProfile(
	strategy: Strategy,
	token: string,
	tokenSecret: string,
	params: Record<string, string>,
): Promise<{ err: Error | null; profile?: Profile | { provider: string; id: string; username: string } }> {
	return new Promise((resolve) => {
		strategy.userProfile(token, tokenSecret, params, (err, profile) => {
			resolve({ err, profile });
		});
	});
}

describe('Strategy#userProfile', () => {
	describe('fetched from default endpoint', () => {
		const strategy = new Strategy(defaultOptions, noop);
		const fixtureBody = loadFixture('account/theSeanCook.json');

		strategy._oauth.get = (_url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			callback(null, fixtureBody, { headers: { 'x-access-level': 'read' } });
		};

		it('should parse profile', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '6253282' });
			expect(err).toBeNull();
			expect(profile).toBeDefined();
			const p = profile as Profile;
			expect(p.provider).toBe('twitter');
			expect(p.id).toBe('38895958');
			expect(p.username).toBe('theSeanCook');
			expect(p.displayName).toBe('Sean Cook');
			expect(typeof p._raw).toBe('string');
			expect(typeof p._json).toBe('object');
			expect(p._accessLevel).toBe('read');
		});
	});

	describe('fetched from default endpoint, with email included', () => {
		const strategy = new Strategy({ ...defaultOptions, includeEmail: true }, noop);
		const fixtureBody = loadFixture('account/theSeanCook.json');

		strategy._oauth.get = (url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			expect(url).toContain('include_email=true');
			callback(null, fixtureBody, { headers: { 'x-access-level': 'read' } });
		};

		it('should include email param in URL', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '6253282' });
			expect(err).toBeNull();
			expect(profile).toBeDefined();
		});
	});

	describe('fetched from default endpoint, with status excluded', () => {
		const strategy = new Strategy({ ...defaultOptions, includeStatus: false }, noop);
		const fixtureBody = loadFixture('account/theSeanCook.json');

		strategy._oauth.get = (url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			expect(url).toContain('skip_status=true');
			callback(null, fixtureBody, { headers: { 'x-access-level': 'read' } });
		};

		it('should include skip_status param in URL', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '6253282' });
			expect(err).toBeNull();
			expect(profile).toBeDefined();
		});
	});

	describe('fetched from default endpoint, with entities excluded', () => {
		const strategy = new Strategy({ ...defaultOptions, includeEntities: false }, noop);
		const fixtureBody = loadFixture('account/theSeanCook.json');

		strategy._oauth.get = (url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			expect(url).toContain('include_entities=false');
			callback(null, fixtureBody, { headers: { 'x-access-level': 'read' } });
		};

		it('should include include_entities param in URL', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '6253282' });
			expect(err).toBeNull();
			expect(profile).toBeDefined();
		});
	});

	describe('fetched from legacy users/show endpoint', () => {
		const strategy = new Strategy({ ...defaultOptions, userProfileURL: 'https://api.twitter.com/1.1/users/show.json' }, noop);
		const fixtureBody = loadFixture('users/rsarver.json');

		strategy._oauth.get = (url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			expect(url).toContain('user_id=6253282');
			callback(null, fixtureBody, { headers: { 'x-access-level': 'read' } });
		};

		it('should parse profile and include user_id in URL', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '6253282' });
			expect(err).toBeNull();
			const p = profile as Profile;
			expect(p.provider).toBe('twitter');
			expect(p.id).toBe('795649');
			expect(p.username).toBe('rsarver');
			expect(p.displayName).toBe('Ryan Sarver');
			expect(p._accessLevel).toBe('read');
		});
	});

	describe('skipping extended profile', () => {
		const strategy = new Strategy({ ...defaultOptions, skipExtendedUserProfile: true }, noop);

		strategy._oauth.get = () => {
			throw new Error('should not fetch profile');
		};

		it('should return minimal profile from params', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', {
				user_id: '1705',
				screen_name: 'jaredhanson',
			});
			expect(err).toBeNull();
			expect(profile).toBeDefined();
			const p = profile as { provider: string; id: string; username: string };
			expect(p.provider).toBe('twitter');
			expect(p.id).toBe('1705');
			expect(p.username).toBe('jaredhanson');
		});
	});

	describe('error caused by invalid token', () => {
		const strategy = new Strategy({ ...defaultOptions, userProfileURL: 'https://api.twitter.com/1.1/users/show.json' }, noop);

		strategy._oauth.get = (_url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			const body = '{"errors":[{"message":"Invalid or expired token","code":89}]}';
			callback({ statusCode: 401, data: body });
		};

		it('should return APIError', async () => {
			const { err, profile } = await getUserProfile(strategy, 'x-token', 'token-secret', { user_id: '123' });
			expect(err).toBeInstanceOf(APIError);
			expect(err?.message).toBe('Invalid or expired token');
			expect((err as APIError).code).toBe(89);
			expect((err as APIError).status).toBe(500);
			expect(profile).toBeUndefined();
		});
	});

	describe('error caused by malformed response', () => {
		const strategy = new Strategy({ ...defaultOptions, userProfileURL: 'https://api.twitter.com/1.1/users/show.json' }, noop);

		strategy._oauth.get = (_url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			callback(null, 'Hello, world.', undefined);
		};

		it('should return parse error', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '123' });
			expect(err).toBeInstanceOf(Error);
			expect(err?.message).toBe('Failed to parse user profile');
			expect(profile).toBeUndefined();
		});
	});

	describe('internal error', () => {
		const strategy = new Strategy({ ...defaultOptions, userProfileURL: 'https://api.twitter.com/1.1/users/show.json' }, noop);

		strategy._oauth.get = (_url: string, _token: string, _tokenSecret: string, callback: (...args: unknown[]) => void) => {
			callback(new Error('something went wrong'));
		};

		it('should return InternalOAuthError', async () => {
			const { err, profile } = await getUserProfile(strategy, 'token', 'token-secret', { user_id: '123' });
			expect(err).toBeInstanceOf(Error);
			expect(err?.constructor.name).toBe('InternalOAuthError');
			expect(err?.message).toBe('Failed to fetch user profile');
			expect(profile).toBeUndefined();
		});
	});
});
