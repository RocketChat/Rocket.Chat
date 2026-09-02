import { buildRateLimiterInput, buildRateLimiterRule } from './rateLimiterKey';

const ROUTE = '/v1/chat.sendMessagepost';

const bucketOf = (rule: Record<string, unknown>) => Object.keys(rule).sort();

describe('buildRateLimiterRule', () => {
	it('should bucket by address by default and when per is explicitly ip', () => {
		expect(bucketOf(buildRateLimiterRule(ROUTE))).toEqual(['IPAddr', 'route']);
		expect(bucketOf(buildRateLimiterRule(ROUTE, 'ip'))).toEqual(['IPAddr', 'route']);
	});

	it("should bucket by user when per is 'user'", () => {
		expect(bucketOf(buildRateLimiterRule(ROUTE, 'user'))).toEqual(['route', 'userId']);
	});

	it('should carry the route so each endpoint counts separately', () => {
		expect(buildRateLimiterRule(ROUTE, 'user')).toMatchObject({ route: ROUTE });
		expect(buildRateLimiterRule(ROUTE, 'ip')).toMatchObject({ route: ROUTE });
	});

	it('should match a subject by returning it, so the package treats the rule as applicable', () => {
		const matchUser = (buildRateLimiterRule(ROUTE, 'user') as { userId: (input: string) => unknown }).userId;
		const matchAddress = (buildRateLimiterRule(ROUTE, 'ip') as { IPAddr: (input: string) => unknown }).IPAddr;

		expect(matchUser('alice')).toBe('alice');
		expect(matchAddress('1.2.3.4')).toBe('1.2.3.4');
	});
});

describe('buildRateLimiterInput', () => {
	it('should carry both subjects so either rule shape matches it', () => {
		expect(buildRateLimiterInput({ route: ROUTE, IPAddr: '1.2.3.4', userId: 'alice' })).toEqual({
			IPAddr: '1.2.3.4',
			userId: 'alice',
			route: ROUTE,
		});
	});

	it('should fall back to the address as the user subject when unauthenticated, never leaving it falsy', () => {
		const expected = { IPAddr: '1.2.3.4', userId: 'ip:1.2.3.4', route: ROUTE };

		expect(buildRateLimiterInput({ route: ROUTE, IPAddr: '1.2.3.4' })).toEqual(expected);
		expect(buildRateLimiterInput({ route: ROUTE, IPAddr: '1.2.3.4', userId: '' })).toEqual(expected);
	});

	it('should keep users on a shared address apart', () => {
		const alice = buildRateLimiterInput({ route: ROUTE, IPAddr: '1.2.3.4', userId: 'alice' });
		const bob = buildRateLimiterInput({ route: ROUTE, IPAddr: '1.2.3.4', userId: 'bob' });

		expect(alice.userId).not.toBe(bob.userId);
		expect(alice.IPAddr).toBe(bob.IPAddr);
	});
});
