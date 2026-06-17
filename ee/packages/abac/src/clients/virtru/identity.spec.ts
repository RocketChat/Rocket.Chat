import { buildEntityIdentifier, getUserEntityKey, buildAttributeFqns, parseAttributeFqns } from './identity';

describe('virtru/identity', () => {
	it('buildEntityIdentifier maps emailAddress vs oidcIdentifier', () => {
		expect(buildEntityIdentifier('emailAddress', 'a@b.com')).toEqual({ emailAddress: 'a@b.com' });
		expect(buildEntityIdentifier('oidcIdentifier', 'bob')).toEqual({ id: 'bob' });
	});

	it('getUserEntityKey resolves per defaultEntityKey', () => {
		expect(getUserEntityKey('emailAddress', { _id: 'u', emails: [{ address: 'a@b.com', verified: true }], username: 'bob' })).toBe(
			'a@b.com',
		);
		expect(getUserEntityKey('oidcIdentifier', { _id: 'u', emails: [], username: 'bob' })).toBe('bob');
		expect(getUserEntityKey('emailAddress', { _id: 'u', username: 'bob' })).toBeUndefined();
	});

	it('buildAttributeFqns round-trips with parseAttributeFqns', () => {
		const attrs = [{ key: 'clearance', values: ['secret', 'topsecret'] }];
		const fqns = buildAttributeFqns('example.com', attrs);
		expect(fqns).toEqual(['https://example.com/attr/clearance/value/secret', 'https://example.com/attr/clearance/value/topsecret']);
		expect(parseAttributeFqns(fqns).attributes).toEqual([{ key: 'clearance', values: ['secret', 'topsecret'] }]);
	});

	it('buildAttributeFqns throws when namespace empty', () => {
		expect(() => buildAttributeFqns('', [{ key: 'k', values: ['v'] }])).toThrow();
	});

	it('parseAttributeFqns returns malformed FQNs alongside parsed attributes', () => {
		const { attributes, malformed } = parseAttributeFqns(['https://example.com/attr/k/value/v', 'not-a-fqn', 'https://example.com/broken']);
		expect(malformed).toEqual(['not-a-fqn', 'https://example.com/broken']);
		expect(attributes).toEqual([{ key: 'k', values: ['v'] }]);
	});
});
