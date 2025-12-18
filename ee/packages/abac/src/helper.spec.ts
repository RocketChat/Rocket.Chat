import {
	validateAndNormalizeAttributes,
	MAX_ABAC_ATTRIBUTE_KEYS,
	MAX_ABAC_ATTRIBUTE_VALUES,
	diffAttributeSets,
	buildRoomNonCompliantConditionsFromSubject,
	extractAttribute,
	ensureAttributeDefinitionsExist,
	buildNonCompliantConditions,
} from './helper';

const attributesFindMock = jest.fn();
jest.mock('@rocket.chat/models', () => {
	return {
		AbacAttributes: {
			find: jest.fn().mockReturnValue({
				toArray: () => attributesFindMock(),
			}),
		},
	};
});

describe('validateAndNormalizeAttributes', () => {
	it('normalizes keys and merges duplicate values from multiple entries', () => {
		const result = validateAndNormalizeAttributes({
			' dept ': [' sales ', 'marketing', 'sales', '', 'marketing '],
			'role': [' admin ', 'user', 'user '],
			'dept': ['engineering'],
		});

		expect(result).toEqual([
			{ key: 'dept', values: ['sales', 'marketing', 'engineering'] },
			{ key: 'role', values: ['admin', 'user'] },
		]);
	});

	it('throws when a key has no remaining sanitized values', () => {
		expect(() =>
			validateAndNormalizeAttributes({
				role: ['   ', '\n', '\t'],
			}),
		).toThrow('error-invalid-attribute-values');
	});

	it('throws when a key exceeds the maximum number of unique values', () => {
		const values = Array.from({ length: MAX_ABAC_ATTRIBUTE_VALUES + 1 }, (_, i) => `value-${i}`);
		expect(() =>
			validateAndNormalizeAttributes({
				role: values,
			}),
		).toThrow('error-invalid-attribute-values');
	});

	it('throws when attempting to add a new key beyond MAX_ABAC_ATTRIBUTE_KEYS', () => {
		const baseEntries = Object.fromEntries(Array.from({ length: MAX_ABAC_ATTRIBUTE_KEYS }, (_, i) => [`key-${i}`, ['value']]));

		expect(() =>
			validateAndNormalizeAttributes({
				...baseEntries,
				'extra-key': ['value'],
			}),
		).toThrow('error-invalid-attribute-values');
	});

	it('throws when total unique attribute keys exceeds limit (post-aggregation check)', () => {
		const attributes = Object.fromEntries(Array.from({ length: MAX_ABAC_ATTRIBUTE_KEYS + 1 }, (_, i) => [`key-${i}`, ['value']]));

		expect(() => validateAndNormalizeAttributes(attributes)).toThrow('error-invalid-attribute-values');
	});

	it('throws when a key exceeds the maximum number of unique values (bucket size limit)', () => {
		const values = Array.from({ length: MAX_ABAC_ATTRIBUTE_VALUES + 1 }, (_, i) => `value-${i}`);

		expect(() =>
			validateAndNormalizeAttributes({
				role: values,
			}),
		).toThrow('error-invalid-attribute-values');
	});

	it('throws when a key has only invalid/empty values after sanitization', () => {
		expect(() =>
			validateAndNormalizeAttributes({
				role: ['   ', '\n', '\t'],
			}),
		).toThrow('error-invalid-attribute-values');
	});
});

describe('ensureAttributeDefinitionsExist', () => {
	afterEach(() => {
		attributesFindMock.mockReset();
	});

	it('does nothing when normalized is empty', async () => {
		await ensureAttributeDefinitionsExist([]);
	});

	it('throws when some attribute definitions are missing (size mismatch)', async () => {
		const normalized = [
			{ key: 'dept', values: ['eng'] },
			{ key: 'role', values: ['admin'] },
		];

		attributesFindMock.mockResolvedValue([{ key: 'dept', values: ['eng', 'sales'] }]);

		await expect(ensureAttributeDefinitionsExist(normalized)).rejects.toThrow('error-attribute-definition-not-found');
	});

	it('throws when a normalized value is not in the allowed definition values', async () => {
		const normalized = [{ key: 'dept', values: ['eng', 'support'] }];

		attributesFindMock.mockResolvedValue([{ key: 'dept', values: ['eng', 'sales'] }]);

		await expect(ensureAttributeDefinitionsExist(normalized)).rejects.toThrow('error-invalid-attribute-values');
	});
});

describe('diffAttributeSets', () => {
	it('returns false/false when both sets are empty', () => {
		const result = diffAttributeSets([], []);

		expect(result).toEqual({ added: false, removed: false });
	});

	it('detects only additions when moving from empty to non-empty', () => {
		const current: { key: string; values: string[] }[] = [];
		const next: { key: string; values: string[] }[] = [
			{ key: 'dept', values: ['eng'] },
			{ key: 'role', values: ['admin'] },
		];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: true, removed: false });
	});

	it('detects only removals when moving from non-empty to empty', () => {
		const current: { key: string; values: string[] }[] = [
			{ key: 'dept', values: ['eng'] },
			{ key: 'role', values: ['admin'] },
		];
		const next: { key: string; values: string[] }[] = [];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: false, removed: true });
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

		expect(result).toEqual({ added: false, removed: false });
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

		expect(result).toEqual({ added: false, removed: false });
	});

	it('detects added values for an existing key', () => {
		const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];
		const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng', 'sales'] }];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: true, removed: false });
	});

	it('detects removed values for an existing key', () => {
		const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng', 'sales'] }];
		const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: false, removed: true });
	});

	it('detects added and removed values on the same key', () => {
		const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng', 'sales'] }];
		const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['support'] }];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: true, removed: true });
	});

	it('detects newly added keys as additions', () => {
		const current: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];
		const next: { key: string; values: string[] }[] = [
			{ key: 'dept', values: ['eng'] },
			{ key: 'role', values: ['admin'] },
		];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: true, removed: false });
	});

	it('detects removed keys as removals', () => {
		const current: { key: string; values: string[] }[] = [
			{ key: 'dept', values: ['eng'] },
			{ key: 'role', values: ['admin'] },
		];
		const next: { key: string; values: string[] }[] = [{ key: 'dept', values: ['eng'] }];

		const result = diffAttributeSets(current, next);

		expect(result).toEqual({ added: false, removed: true });
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

		expect(result).toEqual({ added: true, removed: true });
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

		expect(result).toEqual({ added: true, removed: true });
	});
});

describe('buildNonCompliantConditions', () => {
	type AttributeDef = { key: string; values: string[] };

	it('returns empty array for empty attributes list', () => {
		const result = buildNonCompliantConditions([]);
		expect(result).toEqual([]);
	});

	it('maps single attribute to $not $elemMatch query', () => {
		const attrs: AttributeDef[] = [{ key: 'dept', values: ['eng', 'sales'] }];
		const result = buildNonCompliantConditions(attrs);

		expect(result).toEqual([
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

		expect(result).toEqual([
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

describe('buildRoomNonCompliantConditionsFromSubject', () => {
	it('returns a single condition matching rooms with keys not in the subject set when subject has one key', () => {
		const subject = [{ key: 'dept', values: ['eng'] }];

		const result = buildRoomNonCompliantConditionsFromSubject(subject);

		expect(result).toEqual([
			{
				abacAttributes: {
					$elemMatch: {
						key: { $nin: ['dept'] },
					},
				},
			},
			{
				abacAttributes: {
					$elemMatch: {
						key: 'dept',
						values: { $elemMatch: { $nin: ['eng'] } },
					},
				},
			},
		]);
	});

	it('builds key-$nin condition using all subject keys and per-key $nin for each attribute', () => {
		const subject = [
			{ key: 'dept', values: ['eng', 'sales'] },
			{ key: 'role', values: ['admin'] },
		];

		const result = buildRoomNonCompliantConditionsFromSubject(subject);

		expect(result[0]).toEqual({
			abacAttributes: {
				$elemMatch: {
					key: { $nin: ['dept', 'role'] },
				},
			},
		});

		expect(result[1]).toEqual({
			abacAttributes: {
				$elemMatch: {
					key: 'dept',
					values: { $elemMatch: { $nin: ['eng', 'sales'] } },
				},
			},
		});

		expect(result[2]).toEqual({
			abacAttributes: {
				$elemMatch: {
					key: 'role',
					values: { $elemMatch: { $nin: ['admin'] } },
				},
			},
		});
	});

	it('returns only the key-$nin condition when subject has no values for keys (empty arrays)', () => {
		const subject = [
			{ key: 'dept', values: [] },
			{ key: 'role', values: [] },
		];

		const result = buildRoomNonCompliantConditionsFromSubject(subject);

		expect(result[0]).toEqual({
			abacAttributes: {
				$elemMatch: {
					key: { $nin: ['dept', 'role'] },
				},
			},
		});

		expect(result[1]).toEqual({
			abacAttributes: {
				$elemMatch: {
					key: 'dept',
					values: { $elemMatch: { $nin: [] } },
				},
			},
		});

		expect(result[2]).toEqual({
			abacAttributes: {
				$elemMatch: {
					key: 'role',
					values: { $elemMatch: { $nin: [] } },
				},
			},
		});
	});
});

describe('extractAttribute', () => {
	it('returns undefined when ldapKey or abacKey is missing', () => {
		const ldapUser = { memberOf: ['CN=Eng,OU=Groups'] } as any;

		expect(extractAttribute(ldapUser, '', 'dept')).toBeUndefined();
		expect(extractAttribute(ldapUser, 'memberOf', '')).toBeUndefined();
	});

	it('returns undefined when ldapUser does not have the provided key', () => {
		const ldapUser = { other: ['value'] } as any;

		expect(extractAttribute(ldapUser, 'memberOf', 'dept')).toBeUndefined();
	});

	it('extracts and normalizes a single string value', () => {
		const ldapUser = { department: '  Engineering  ' } as any;

		const result = extractAttribute(ldapUser, 'department', 'dept');

		expect(result).toEqual({
			key: 'dept',
			values: ['Engineering'],
		});
	});

	it('extracts from an array, trimming and deduplicating values', () => {
		const ldapUser = {
			memberOf: ['  Eng  ', 'Sales', 'Eng', '  ', '\tSales\t'],
		} as any;

		const result = extractAttribute(ldapUser, 'memberOf', 'dept');

		// Order is preserved by insertion into the Set in implementation: ['Eng', 'Sales']
		expect(result).toEqual({
			key: 'dept',
			values: ['Eng', 'Sales'],
		});
	});

	it('ignores non-string values and empty/whitespace-only strings', () => {
		const ldapUser = {
			memberOf: ['  ', 123, null, '  Eng  ', undefined, {}, '\n'],
		} as any;

		const result = extractAttribute(ldapUser, 'memberOf', 'dept');

		expect(result).toEqual({
			key: 'dept',
			values: ['Eng'],
		});
	});

	it('returns undefined when all values are filtered out', () => {
		const ldapUser = {
			memberOf: ['  ', '\n', '\t'],
		} as any;

		const result = extractAttribute(ldapUser, 'memberOf', 'dept');

		expect(result).toBeUndefined();
	});
});
