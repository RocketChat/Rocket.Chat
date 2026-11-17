import { normalizeId } from './normalizeId';

describe('normalizeId', () => {
	const hexId = '6a7fc7b8376b837b4b8aa6c3';
	// Base64 encoding of 6a7fc7b8376b837b4b8aa6c3 (12 bytes)
	const base64Id = 'an/HuDdrg3tLiqbD';

	it('returns a string identifier unchanged', () => {
		expect(normalizeId(hexId)).toBe(hexId);
		expect(normalizeId('GENERAL')).toBe('GENERAL');
	});

	it('handles null and undefined', () => {
		expect(normalizeId(null)).toBe('');
		expect(normalizeId(undefined)).toBe('');
	});

	it('converts numbers to string', () => {
		expect(normalizeId(12345)).toBe('12345');
		expect(normalizeId(BigInt(999))).toBe('999');
	});

	it('converts MongoDB / BSON ObjectId with toHexString()', () => {
		const objectId = {
			toHexString: () => hexId,
		};
		expect(normalizeId(objectId)).toBe(hexId);
	});

	it('converts Meteor Mongo.ObjectID with _str property', () => {
		const mongoId = {
			_str: hexId,
		};
		expect(normalizeId(mongoId)).toBe(hexId);
	});

	it('converts EJSON $oid object representation', () => {
		const ejsonOid = {
			$oid: hexId,
		};
		expect(normalizeId(ejsonOid)).toBe(hexId);
	});

	it('converts raw Uint8Array / Buffer binary bytes into hex string', () => {
		const bytes = new Uint8Array([
			0x6a, 0x7f, 0xc7, 0xb8, 0x37, 0x6b, 0x83, 0x7b, 0x4b, 0x8a, 0xa6, 0xc3,
		]);
		expect(normalizeId(bytes)).toBe(hexId);
	});

	it('converts Meteor DDP EJSON binary buffer payload { buffer: { $binary: ... } }', () => {
		const payload = {
			buffer: {
				$binary: base64Id,
			},
		};
		expect(normalizeId(payload)).toBe(hexId);
	});

	it('converts direct EJSON binary object { $binary: ... }', () => {
		const payload = {
			$binary: base64Id,
		};
		expect(normalizeId(payload)).toBe(hexId);
	});

	it('converts EJSON v2 binary object { $binary: { base64: ... } }', () => {
		const payload = {
			$binary: {
				base64: base64Id,
				subType: '00',
			},
		};
		expect(normalizeId(payload)).toBe(hexId);
	});

	it('converts { buffer: Uint8Array } wrapper', () => {
		const bytes = new Uint8Array([
			0x6a, 0x7f, 0xc7, 0xb8, 0x37, 0x6b, 0x83, 0x7b, 0x4b, 0x8a, 0xa6, 0xc3,
		]);
		expect(normalizeId({ buffer: bytes })).toBe(hexId);
	});

	it('converts custom Meteor types implementing toJSONValue()', () => {
		const customType = {
			toJSONValue: () => hexId,
		};
		expect(normalizeId(customType)).toBe(hexId);
	});

	it('converts custom objects with custom toString()', () => {
		const customObj = {
			toString: () => 'custom-id-value',
		};
		expect(normalizeId(customObj)).toBe('custom-id-value');
	});
});
