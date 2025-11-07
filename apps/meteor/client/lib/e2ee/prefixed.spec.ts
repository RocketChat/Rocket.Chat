import { Base64 } from '@rocket.chat/base64';

import { PrefixedBase64 } from './prefixed';

const prefix = '32c9e7917b78';
const base64 =
	'ibtLAKG9zcQ/NTp+86nVelUjewPbPNW+EC+eagVPVVlbxvWNXkgltrBQB4gDao1Fp6fHUibQB3dirJ4rzy7CViww0o4QjAwPPQMIxZ9DLJhjKnu6bkkOp6Z0/a9g/8Wf/cvP9/bp7tUt7Et4XMmJwIe5iyJZ35lsyduLc8V+YyK8sJiGf4BRagJoBr8xEBgqBWqg6Vwn3qtbbiTs65PqErbaUmSM3Hn6tfkcS6ukLG/DbptW1B9U66IX3fQesj50zWZiJyvxOoxDeHRH9UEStyv9SP8nrFjEKM3TDiakBeDxja6LoN8l3CjP9K/5eg25YqANZAQjlwaCaeTTHndTgQ==';
const prefixed = `${prefix}${base64}`;

describe('PrefixedBase64', () => {
	it('should roundtrip', () => {
		const [kid, decodedKey] = PrefixedBase64.decode(prefixed);
		expect(kid).toBe(prefix);
		const reencoded = PrefixedBase64.encode([kid, decodedKey]);
		expect(reencoded).toBe(prefixed);
	});

	it('should throw on invalid decode input length', () => {
		expect(() => PrefixedBase64.decode('too-short')).toThrow(RangeError);
	});

	it('should throw on invalid decoded data length', () => {
		const invalidPrefixed = `32c9e7917b78${'A'.repeat(343)}`; // One character short
		expect(() => PrefixedBase64.decode(invalidPrefixed)).toThrow(RangeError);
	});

	it('should throw on invalid encode input data length', () => {
		const invalidData = new Uint8Array(255); // One byte short
		expect(() => PrefixedBase64.encode([prefix, invalidData])).toThrow(RangeError);
	});

	it('should throw on invalid encoded Base64 length', () => {
		// This is a bit contrived since our encode implementation always produces valid length,
		// but we include it for completeness.
		const invalidData = new Uint8Array(256);
		jest.spyOn(Base64, 'encode').mockReturnValue('A'.repeat(343)); // One character short
		expect(() => PrefixedBase64.encode([prefix, invalidData])).toThrow(RangeError);
	});
});
