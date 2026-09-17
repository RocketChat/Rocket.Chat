import { normalizeId } from './normalizeId';

describe('normalizeId', () => {
	it('should return a string as-is', () => {
		expect(normalizeId('6a7fc7b8376b837b4b8aa6c3')).toBe('6a7fc7b8376b837b4b8aa6c3');
	});

	it('should normalize BSON ObjectId with toHexString()', () => {
		const oid = {
			toHexString: () => '6a7fc7b8376b837b4b8aa6c3',
		};
		expect(normalizeId(oid)).toBe('6a7fc7b8376b837b4b8aa6c3');
	});

	it('should normalize raw DDP wire format { buffer: { $binary: base64 } }', () => {
		const raw = {
			buffer: {
				$binary: 'an/HuDdrg3tLiqbD',
			},
		};
		expect(normalizeId(raw)).toBe('6a7fc7b8376b837b4b8aa6c3');
	});

	it('should normalize parsed EJSON { buffer: Uint8Array }', () => {
		const parsed = {
			buffer: new Uint8Array([106, 127, 199, 184, 55, 107, 131, 123, 75, 138, 166, 195]),
		};
		expect(normalizeId(parsed)).toBe('6a7fc7b8376b837b4b8aa6c3');
	});

	it('should return empty string for unrecognized or falsy values', () => {
		expect(normalizeId(null)).toBe('');
		expect(normalizeId(undefined)).toBe('');
		expect(normalizeId({})).toBe('');
		expect(normalizeId(12345)).toBe('');
	});
});
