import { generateDialbackKey, generateStreamId, verifyDialbackKey } from './dialback';

describe('generateDialbackKey', () => {
	// Test vector from XEP-0185 §2
	it('matches the XEP-0185 example key', () => {
		expect(generateDialbackKey('s3cr3tf0rd14lb4ck', 'xmpp.example.com', 'example.org', 'D60000229F')).toBe(
			'37c69b1cf07a3f67c04a5ef5902fa5114f2c76fe4a2686482ba5b89323075643',
		);
	});

	it('binds the key to every input', () => {
		const base = generateDialbackKey('secret', 'recv.tld', 'orig.tld', 'abc');
		expect(generateDialbackKey('other', 'recv.tld', 'orig.tld', 'abc')).not.toBe(base);
		expect(generateDialbackKey('secret', 'other.tld', 'orig.tld', 'abc')).not.toBe(base);
		expect(generateDialbackKey('secret', 'recv.tld', 'other.tld', 'abc')).not.toBe(base);
		expect(generateDialbackKey('secret', 'recv.tld', 'orig.tld', 'xyz')).not.toBe(base);
	});
});

describe('verifyDialbackKey', () => {
	it('accepts a key generated with the same inputs', () => {
		const key = generateDialbackKey('secret', 'recv.tld', 'orig.tld', 'abc');
		expect(verifyDialbackKey('secret', 'recv.tld', 'orig.tld', 'abc', key)).toBe(true);
	});

	it('rejects mismatched keys without throwing on length differences', () => {
		expect(verifyDialbackKey('secret', 'recv.tld', 'orig.tld', 'abc', 'short')).toBe(false);
		expect(verifyDialbackKey('secret', 'recv.tld', 'orig.tld', 'abc', generateDialbackKey('x', 'recv.tld', 'orig.tld', 'abc'))).toBe(false);
	});
});

describe('generateStreamId', () => {
	it('produces unique unguessable-length ids', () => {
		const a = generateStreamId();
		const b = generateStreamId();
		expect(a).toHaveLength(32);
		expect(a).not.toBe(b);
	});
});
