import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as z from 'zod';

import { createMappedCodec, mappedDecode, mappedDecodeAsync } from '../../../../../../app/apps/server/converters/codecs/mappedData';

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

	it('maps a nested object recursively, bucketing unmapped fields at each level', async () => {
		const result = await mappedDecodeAsync(
			{ _id: 'c1', visitor: { visitorId: 'v1', extra: 'drop' }, spare: true },
			{
				_id: '_id',
				visitor: { from: 'visitor', map: { visitorId: 'visitorId' } },
			},
		);

		expect(result).to.deep.equal({
			_id: 'c1',
			visitor: { visitorId: 'v1', _unmappedProperties_: { extra: 'drop' } },
			_unmappedProperties_: { spare: true },
		});
	});

	it('omits a nested object whose source is missing without a property access error', async () => {
		const result = await mappedDecodeAsync(
			{ _id: 'c1', spare: true },
			{
				_id: '_id',
				lastChat: { from: 'lastChat', map: { _id: '_id', ts: 'ts' } },
				visitor: { from: 'visitor', map: { visitorId: 'visitorId' } },
				details: { from: 'details', map: { type: 'type' } },
			},
		);

		expect(result).to.deep.equal({ _id: 'c1', _unmappedProperties_: { spare: true } });
		expect(result).to.not.have.property('lastChat');
		expect(result).to.not.have.property('visitor');
		expect(result).to.not.have.property('details');
	});

	it('omits a nested object whose source is null without a property access error', async () => {
		const result = await mappedDecodeAsync(
			{ _id: 'c1', lastChat: null, visitor: null, details: null, spare: true },
			{
				_id: '_id',
				lastChat: { from: 'lastChat', map: { _id: '_id', ts: 'ts' } },
				visitor: { from: 'visitor', map: { visitorId: 'visitorId' } },
				details: { from: 'details', map: { type: 'type' } },
			},
		);

		expect(result).to.deep.equal({ _id: 'c1', _unmappedProperties_: { spare: true } });
		expect(result).to.not.have.property('lastChat');
		expect(result).to.not.have.property('visitor');
		expect(result).to.not.have.property('details');
	});

	it('drops the _unmappedProperties_ bucket at the root and every nested level when `dropUnmapped` is set', async () => {
		const result = await mappedDecodeAsync(
			{ _id: 'c1', visitor: { visitorId: 'v1', extra: 'drop' }, phones: [{ phoneNumber: '1', extra: 'x' }], spare: true },
			{
				_id: '_id',
				visitor: { from: 'visitor', map: { visitorId: 'visitorId' } },
				phones: { from: 'phones', list: true, map: { phoneNumber: 'phoneNumber' } },
			},
			{ dropUnmapped: true },
		);

		expect(result).to.deep.equal({
			_id: 'c1',
			visitor: { visitorId: 'v1' },
			phones: [{ phoneNumber: '1' }],
		});
	});

	it('copies a nested source verbatim when the descriptor has no `map`', async () => {
		const result = await mappedDecodeAsync(
			{ _id: 'c1', details: { type: 'sms', id: 'sms-1' }, spare: true },
			{
				_id: '_id',
				details: { from: 'details' },
			},
		);

		expect(result).to.deep.equal({
			_id: 'c1',
			details: { type: 'sms', id: 'sms-1' },
			_unmappedProperties_: { spare: true },
		});
	});

	it('maps a list of objects via `list` + `map`, bucketing each element', async () => {
		const result = await mappedDecodeAsync(
			{ phones: [{ phoneNumber: '1', extra: 'x' }, { phoneNumber: '2' }] },
			{ phones: { from: 'phones', list: true, map: { phoneNumber: 'phoneNumber' } } },
		);

		expect(result).to.deep.equal({
			phones: [
				{ phoneNumber: '1', _unmappedProperties_: { extra: 'x' } },
				{ phoneNumber: '2', _unmappedProperties_: {} },
			],
			_unmappedProperties_: {},
		});
	});

	it('drops a source property from the bucket when a function deletes it explicitly', async () => {
		const result = await mappedDecodeAsync(
			{ firstName: 'John', lastName: 'Doe' },
			{
				fullName: (d: Record<string, any>) => {
					const value = `${d.firstName} ${d.lastName}`;
					delete d.firstName;
					return value;
				},
			},
		);

		expect(result).to.deep.equal({ fullName: 'John Doe', _unmappedProperties_: { lastName: 'Doe' } });
	});

	it('wraps a non-array value into a list when `list` is true', async () => {
		const result = await mappedDecodeAsync({ tag: 'admin' }, { tags: { from: 'tag', list: true, map: {} } });

		expect(result).to.deep.equal({ tags: ['admin'], _unmappedProperties_: {} });
	});

	it('keeps every property as unmapped when the map is empty', async () => {
		const result = await mappedDecodeAsync({ os: 'android', version: '1.9', lan: 'en' }, {});

		expect(result).to.deep.equal({ _unmappedProperties_: { os: 'android', version: '1.9', lan: 'en' } });
	});
});

describe('mappedDecode type constraints', () => {
	type Source = { _id: string; name: string };

	it('constrains map values to keys of the source type and infers the decoded shape', () => {
		const decode = mappedDecode<Source>({ id: '_id', label: 'name' });
		const result = decode({ _id: 'a', name: 'b' });

		// `result` is typed `Decoded<Source, ...>`: renamed targets plus the bucket.
		expect(result).to.deep.equal({ id: 'a', label: 'b', _unmappedProperties_: {} });

		// @ts-expect-error - 'missing' is not a key of Source, so the field map is rejected.
		mappedDecode<Source>({ id: 'missing' });
	});
});
