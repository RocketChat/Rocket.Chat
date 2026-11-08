import { orderSrvRecords } from './dnsResolver';

describe('orderSrvRecords', () => {
	it('orders by ascending priority', () => {
		const ordered = orderSrvRecords(
			[
				{ priority: 20, weight: 0, name: 'backup.tld', port: 5269 },
				{ priority: 10, weight: 0, name: 'primary.tld', port: 5269 },
			],
			() => 0,
		);

		expect(ordered.map((r) => r.name)).toEqual(['primary.tld', 'backup.tld']);
	});

	it('keeps zero-weight records selectable within a priority group', () => {
		const ordered = orderSrvRecords(
			[
				{ priority: 10, weight: 0, name: 'a.tld', port: 5269 },
				{ priority: 10, weight: 0, name: 'b.tld', port: 5269 },
			],
			() => 0.99,
		);

		expect(ordered).toHaveLength(2);
		expect(new Set(ordered.map((r) => r.name))).toEqual(new Set(['a.tld', 'b.tld']));
	});

	it('prefers heavier records when random is low', () => {
		const ordered = orderSrvRecords(
			[
				{ priority: 10, weight: 1, name: 'light.tld', port: 5269 },
				{ priority: 10, weight: 1000, name: 'heavy.tld', port: 5269 },
			],
			() => 0.5,
		);

		expect(ordered[0].name).toBe('heavy.tld');
	});
});
