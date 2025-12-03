import { expect } from 'chai';

import { validateAndNormalizeAttributes, MAX_ABAC_ATTRIBUTE_KEYS, MAX_ABAC_ATTRIBUTE_VALUES, diffAttributeSets } from './helper';

describe('validateAndNormalizeAttributes', () => {
	it('normalizes keys and merges duplicate values from multiple entries', () => {
		const result = validateAndNormalizeAttributes({
			' dept ': [' sales ', 'marketing', 'sales', '', 'marketing '],
			'role': [' admin ', 'user', 'user '],
			'dept': ['engineering'],
		});

		expect(result).to.deep.equal([
			{ key: 'dept', values: ['sales', 'marketing', 'engineering'] },
			{ key: 'role', values: ['admin', 'user'] },
		]);
	});

	it('throws when a key has no remaining sanitized values', () => {
		expect(() =>
			validateAndNormalizeAttributes({
				role: ['   ', '\n', '\t'],
			}),
		).to.throw('error-invalid-attribute-values');
	});

	it('throws when a key exceeds the maximum number of unique values', () => {
		const values = Array.from({ length: MAX_ABAC_ATTRIBUTE_VALUES + 1 }, (_, i) => `value-${i}`);
		expect(() =>
			validateAndNormalizeAttributes({
				role: values,
			}),
		).to.throw('error-invalid-attribute-values');
	});

	it('throws when total unique attribute keys exceeds limit', () => {
		const attributes = Object.fromEntries(Array.from({ length: MAX_ABAC_ATTRIBUTE_KEYS + 1 }, (_, i) => [`key-${i}`, ['value']]));
		expect(() => validateAndNormalizeAttributes(attributes)).to.throw('error-invalid-attribute-values');
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

	describe('diffAttributeSets', () => {
		it('returns false/false when both sets are empty', () => {
			const result = diffAttributeSets([], []);

			expect(result).to.deep.equal({ added: false, removed: false });
		});

		it('detects only additions when moving from empty to non-empty', () => {
			const current: { key: string; values: string[] }[] = [];
			const next: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng'] },
				{ key: 'role', values: ['admin'] },
			];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: true, removed: false });
		});

		it('detects only removals when moving from non-empty to empty', () => {
			const current: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng'] },
				{ key: 'role', values: ['admin'] },
			];
			const next: { key: string; values: string[] }[] = [];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: false, removed: true });
		});

		it('returns false/false when sets are identical (same keys and values)', () => {
			const current: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng', 'sales'] },
				{ key: 'role', values: ['admin'] },
			];
			const next: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng', 'sales'] },
				{ key: 'role', values: ['admin'] },
			];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: false, removed: false });
		});

		it('ignores value ordering and still treats sets as identical', () => {
			const current: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng', 'sales'] },
				{ key: 'role', values: ['admin', 'user'] },
			];
			const next: { key: string; values: string[] }[] = [
				{ key: 'role', values: ['user', 'admin'] },
				{ key: 'dept', values: ['sales', 'eng'] },
			];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: false, removed: false });
		});

		it('detects added values for an existing key', () => {
			const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];
			const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng', 'sales'] }];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: true, removed: false });
		});

		it('detects removed values for an existing key', () => {
			const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng', 'sales'] }];
			const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: false, removed: true });
		});

		it('detects added and removed values on the same key', () => {
			const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng', 'sales'] }];
			const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['support'] }];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: true, removed: true });
		});

		it('detects newly added keys as additions', () => {
			const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];
			const next: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng'] },
				{ key: 'role', values: ['admin'] },
			];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: true, removed: false });
		});

		it('detects removed keys as removals', () => {
			const current: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng'] },
				{ key: 'role', values: ['admin'] },
			];
			const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: false, removed: true });
		});

		it('detects both added and removed keys across sets', () => {
			const current: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng'] },
				{ key: 'region', values: ['us'] },
			];
			const next: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng'] },
				{ key: 'role', values: ['admin'] },
			];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: true, removed: true });
		});

		it('handles mixed changes: new key, removed key, added and removed values', () => {
			const current: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng', 'sales'] },
				{ key: 'region', values: ['us', 'eu'] },
			];
			const next: { key: string; values: string[] }[] = [
				{ key: 'dept', values: ['eng', 'support'] }, // sales removed, support added
				{ key: 'role', values: ['admin'] }, // new key
			];

			const result = diffAttributeSets(current, next);

			expect(result).to.deep.equal({ added: true, removed: true });
		});
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
