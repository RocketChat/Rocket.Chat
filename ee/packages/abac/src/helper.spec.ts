import { expect } from 'chai';

import { didSubjectLoseAttributes } from './helper';

describe('didSubjectLoseAttributes', () => {
	const call = (prev: { key: string; values: string[] }[], next: { key: string; values: string[] }[]) =>
		didSubjectLoseAttributes(prev, next);

	it('returns false if previous is empty (no attributes to lose)', () => {
		const prev: { key: string; values: string[] }[] = [];
		const next: { key: string; values: string[] }[] = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns false if all previous attributes and values are preserved', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns false if previous values are a subset of next values (nothing lost)', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns true if an entire previous attribute key is missing in next', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.true;
	});

	it('returns true if any previous value is missing from corresponding next attribute', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.true;
	});

	it('returns true if multiple attributes exist and one loses a value', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		expect(call(prev, next)).to.be.true;
	});

	it('returns true when next is empty but previous had attributes (all lost)', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		const next: { key: string; values: string[] }[] = [];

		expect(call(prev, next)).to.be.true;
	});

	it('returns true if one attribute key remains but all its values are lost', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		const next = [
			{
				key: 'role',
				values: [],
			},
		];

		expect(call(prev, next)).to.be.true;
	});

	it('returns true on first detected loss even if multiple losses exist', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
			{
				key: 'dept',
				values: ['sales', 'marketing'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		expect(call(prev, next)).to.be.true;
	});

	it('does not mutate input arrays (pure function)', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		const prevClone = JSON.parse(JSON.stringify(prev));
		const nextClone = JSON.parse(JSON.stringify(next));

		call(prev, next);

		expect(prev).to.deep.equal(prevClone);
		expect(next).to.deep.equal(nextClone);
	});

	it('returns false if ordering of values changes but values remain (order-insensitive)', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'user'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['user', 'admin'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns true if previous attribute key replaced with a different key only', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		const next = [
			{
				key: 'dept',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.true;
	});

	it('returns false when next adds a new attribute without removing previous ones', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns false when attribute keys are reordered but unchanged', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin'],
			},
			{
				key: 'dept',
				values: ['sales'],
			},
		];

		const next = [
			{
				key: 'dept',
				values: ['sales'],
			},
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns false when duplicate values are present but no unique value is lost', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'admin'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns false when previous attribute has an empty values array (nothing to lose)', () => {
		const prev = [
			{
				key: 'role',
				values: [],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.false;
	});

	it('returns true when duplicate previous values include one that is lost', () => {
		const prev = [
			{
				key: 'role',
				values: ['admin', 'admin', 'user'],
			},
		];

		const next = [
			{
				key: 'role',
				values: ['admin'],
			},
		];

		expect(call(prev, next)).to.be.true;
	});
});

describe('buildNonCompliantConditions', () => {
	type AttributeDef = { key: string; values: string[] };

	const buildNonCompliantConditions = (attrs: AttributeDef[]): any[] => {
		if (!attrs.length) {
			return [];
		}

		return attrs.map((attr) => ({
			abacAttributes: {
				$not: {
					$elemMatch: {
						key: attr.key,
						values: { $all: attr.values },
					},
				},
			},
		}));
	};

	it('returns empty array for empty attributes list', () => {
		const result = buildNonCompliantConditions([]);
		expect(result).to.deep.equal([]);
	});

	it('maps single attribute to $not $elemMatch query', () => {
		const attrs: AttributeDef[] = [{ key: 'dept', values: ['eng', 'sales'] }];
		const result = buildNonCompliantConditions(attrs);

		expect(result).to.deep.equal([
			{
				abacAttributes: {
					$not: {
						$elemMatch: {
							key: 'dept',
							values: { $all: ['eng', 'sales'] },
						},
					},
				},
			},
		]);
	});

	it('maps multiple attributes preserving order', () => {
		const attrs: AttributeDef[] = [
			{ key: 'dept', values: ['eng'] },
			{ key: 'role', values: ['admin', 'user'] },
		];

		const result = buildNonCompliantConditions(attrs);

		expect(result).to.deep.equal([
			{
				abacAttributes: {
					$not: {
						$elemMatch: {
							key: 'dept',
							values: { $all: ['eng'] },
						},
					},
				},
			},
			{
				abacAttributes: {
					$not: {
						$elemMatch: {
							key: 'role',
							values: { $all: ['admin', 'user'] },
						},
					},
				},
			},
		]);
	});
});
