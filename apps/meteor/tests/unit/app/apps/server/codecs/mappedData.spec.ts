import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as z from 'zod';

import { createMappedCodec, mappedDecodeAsync } from '../../../../../../app/apps/server/converters/codecs/mappedData';

describe('createMappedCodec', () => {
	const codec = createMappedCodec({
		id: '_id',
		name: 'name',
		scope: 'scope',
	});

	it('decode renames mapped fields and buckets the rest', () => {
		const result = z.decode(codec, { _id: 'r1', name: 'admin', scope: 'Users', extra: 1, _updatedAt: 'x' });

		expect(result).to.deep.equal({
			id: 'r1',
			name: 'admin',
			scope: 'Users',
			_unmappedProperties_: { extra: 1, _updatedAt: 'x' },
		});
	});

	it('decode omits mapped targets whose source is undefined but still consumes the source key', () => {
		const result = z.decode(codec, { _id: 'r1', name: undefined, other: true });

		expect(result).to.deep.equal({
			id: 'r1',
			_unmappedProperties_: { other: true },
		});
		expect(result).to.not.have.nested.property('_unmappedProperties_.name');
	});

	it('decode does not mutate the input (deep isolation)', () => {
		const input = { _id: 'r1', nested: { a: 1 } };
		const result = z.decode(codec, input) as any;

		result._unmappedProperties_.nested.a = 999;

		expect(input.nested.a).to.equal(1);
	});

	it('encode applies the inverse rename and merges _unmappedProperties_', () => {
		const result = z.encode(codec, { id: 'r1', name: 'admin', scope: 'Users', _unmappedProperties_: { extra: 1 } });

		expect(result).to.deep.equal({ _id: 'r1', name: 'admin', scope: 'Users', extra: 1 });
	});

	it('round-trips decode -> encode back to the original shape', () => {
		const original = { _id: 'r1', name: 'admin', scope: 'Users', extra: 1 };

		expect(z.encode(codec, z.decode(codec, original))).to.deep.equal(original);
	});
});

describe('mappedDecodeAsync', () => {
	it('handles string renames, sync and async derived fields, and buckets the rest', async () => {
		const result = await mappedDecodeAsync(
			{ _id: 'r1', t: 'c', u: { _id: 'u1' }, leftover: 42 },
			{
				id: '_id',
				type: (data) => {
					const { t } = data;
					delete data.t;
					return t === 'c' ? 'channel' : t;
				},
				creator: async (data) => {
					const { u } = data;
					delete data.u;
					return u ? { id: u._id } : undefined;
				},
			},
		);

		expect(result).to.deep.equal({
			id: 'r1',
			type: 'channel',
			creator: { id: 'u1' },
			_unmappedProperties_: { leftover: 42 },
		});
	});

	it('omits derived fields that return undefined and does not mutate the input', async () => {
		const input = { _id: 'r1', nested: { a: 1 } };
		const result = await mappedDecodeAsync(input, {
			id: '_id',
			creator: () => undefined,
		});

		expect(result).to.deep.equal({ id: 'r1', _unmappedProperties_: { nested: { a: 1 } } });
		expect(result).to.not.have.property('creator');

		(result as any)._unmappedProperties_.nested.a = 999;
		expect(input.nested.a).to.equal(1);
	});
});
