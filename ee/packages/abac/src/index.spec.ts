import { AbacService } from './index';

const mockFindOneByIdAndType = jest.fn();
const mockUpdateAbacConfigurationById = jest.fn();
const mockAbacInsertOne = jest.fn();
const mockAbacFindPaginated = jest.fn();
const mockAbacFindOne = jest.fn();
const mockAbacUpdateOne = jest.fn();
const mockAbacDeleteOne = jest.fn();
const mockRoomsIsAbacAttributeInUse = jest.fn();
const mockSetAbacAttributesById = jest.fn();
const mockAbacFind = jest.fn();
const mockUpdateSingleAbacAttributeValuesById = jest.fn();
const mockUpdateAbacAttributeValuesArrayFilteredById = jest.fn();
const mockRemoveAbacAttributeByRoomIdAndKey = jest.fn();
const mockInsertAbacAttributeIfNotExistsById = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		updateAbacConfigurationById: (...args: any[]) => mockUpdateAbacConfigurationById(...args),
		isAbacAttributeInUse: (...args: any[]) => mockRoomsIsAbacAttributeInUse(...args),
		setAbacAttributesById: (...args: any[]) => mockSetAbacAttributesById(...args),
		updateSingleAbacAttributeValuesById: (...args: any[]) => mockUpdateSingleAbacAttributeValuesById(...args),
		updateAbacAttributeValuesArrayFilteredById: (...args: any[]) => mockUpdateAbacAttributeValuesArrayFilteredById(...args),
		removeAbacAttributeByRoomIdAndKey: (...args: any[]) => mockRemoveAbacAttributeByRoomIdAndKey(...args),
		insertAbacAttributeIfNotExistsById: (...args: any[]) => mockInsertAbacAttributeIfNotExistsById(...args),
	},
	AbacAttributes: {
		insertOne: (...args: any[]) => mockAbacInsertOne(...args),
		findPaginated: (...args: any[]) => mockAbacFindPaginated(...args),
		findOne: (...args: any[]) => mockAbacFindOne(...args),
		findOneById: (...args: any[]) => mockAbacFindOne(...args), // map findOneById calls to same mock
		updateOne: (...args: any[]) => mockAbacUpdateOne(...args),
		deleteOne: (...args: any[]) => mockAbacDeleteOne(...args),
		removeById: (...args: any[]) => mockAbacDeleteOne(...args),
		find: (...args: any[]) => mockAbacFind(...args),
	},
}));

// Minimal mock for ServiceClass (we don't need its real behavior in unit scope)
jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {},
}));

describe('AbacService (unit)', () => {
	let service: AbacService;

	beforeEach(() => {
		service = new AbacService();
		jest.clearAllMocks();
	});

	describe('addAbacAttribute', () => {
		it('inserts attribute when valid', async () => {
			const attribute = { key: 'Valid_Key-1', values: ['v1', 'v2'] };
			await service.addAbacAttribute(attribute);
			expect(mockAbacInsertOne).toHaveBeenCalledTimes(1);
			expect(mockAbacInsertOne).toHaveBeenCalledWith(attribute);
		});

		it('accepts key with spaces (no key pattern validation in service)', async () => {
			const attribute = { key: 'Invalid Key!', values: ['v1'] };
			await service.addAbacAttribute(attribute as any);
			expect(mockAbacInsertOne).toHaveBeenCalledWith(attribute);
		});

		it('throws error-invalid-attribute-values for empty values array', async () => {
			const attribute = { key: 'ValidKey', values: [] as string[] };
			await expect(service.addAbacAttribute(attribute)).rejects.toThrow('error-invalid-attribute-values');
			expect(mockAbacInsertOne).not.toHaveBeenCalled();
		});

		it('throws error-duplicate-attribute-key when duplicate index error occurs', async () => {
			const attribute = { key: 'DupKey', values: ['a'] };
			mockAbacInsertOne.mockRejectedValueOnce(new Error('E11000 duplicate key error collection: abac_attributes'));
			await expect(service.addAbacAttribute(attribute)).rejects.toThrow('error-duplicate-attribute-key');
		});

		it('propagates unexpected insert errors', async () => {
			const attribute = { key: 'OtherKey', values: ['x'] };
			mockAbacInsertOne.mockRejectedValueOnce(new Error('network-failure'));
			await expect(service.addAbacAttribute(attribute)).rejects.toThrow('network-failure');
		});

		describe('listAbacAttributes', () => {
			it('returns paginated attributes with defaults (no filters)', async () => {
				const docs = [
					{ _id: '1', key: 'k1', values: ['a', 'b'] },
					{ _id: '2', key: 'k2', values: ['c'] },
				];
				mockAbacFindPaginated.mockReturnValueOnce({
					cursor: { toArray: async () => docs },
					totalCount: Promise.resolve(docs.length),
				});

				const result = await service.listAbacAttributes();
				expect(mockAbacFindPaginated).toHaveBeenCalledWith({}, { projection: { key: 1, values: 1 }, skip: 0, limit: 25 });
				expect(result).toEqual({
					attributes: docs,
					offset: 0,
					count: docs.length,
					total: docs.length,
				});
			});

			it('filters by key only', async () => {
				const docs = [{ _id: '3', key: 'FilterKey', values: ['x'] }];
				mockAbacFindPaginated.mockReturnValueOnce({
					cursor: { toArray: async () => docs },
					totalCount: Promise.resolve(docs.length),
				});

				const result = await service.listAbacAttributes({ key: 'FilterKey' });
				expect(mockAbacFindPaginated).toHaveBeenCalledWith(
					{ $or: [{ key: /FilterKey/i }] },
					{ projection: { key: 1, values: 1 }, skip: 0, limit: 25 },
				);
				expect(result).toEqual({
					attributes: docs,
					offset: 0,
					count: docs.length,
					total: docs.length,
				});
			});

			it('filters by values only with custom pagination', async () => {
				const docs = [
					{ _id: '4', key: 'alpha', values: ['m', 'n'] },
					{ _id: '5', key: 'beta', values: ['n', 'o'] },
				];
				mockAbacFindPaginated.mockReturnValueOnce({
					cursor: { toArray: async () => docs },
					totalCount: Promise.resolve(10),
				});

				const result = await service.listAbacAttributes({ values: 'n,z', offset: 5, count: 2 });
				expect(mockAbacFindPaginated).toHaveBeenCalledWith(
					{ $or: [{ values: /n,z/i }] },
					{ projection: { key: 1, values: 1 }, skip: 5, limit: 2 },
				);
				expect(result).toEqual({
					attributes: docs,
					offset: 5,
					count: docs.length,
					total: 10,
				});
			});

			it('filters by key and values', async () => {
				const docs = [{ _id: '6', key: 'gamma', values: ['p', 'q'] }];
				mockAbacFindPaginated.mockReturnValueOnce({
					cursor: { toArray: async () => docs },
					totalCount: Promise.resolve(docs.length),
				});

				const result = await service.listAbacAttributes({ key: 'gamma', values: 'q' });
				expect(mockAbacFindPaginated).toHaveBeenCalledWith(
					{ $or: [{ key: /gamma/i }, { values: /q/i }] },
					{ projection: { key: 1, values: 1 }, skip: 0, limit: 25 },
				);
				expect(result).toEqual({
					attributes: docs,
					offset: 0,
					count: docs.length,
					total: docs.length,
				});
			});

			it('returns empty when no documents match', async () => {
				mockAbacFindPaginated.mockReturnValueOnce({
					cursor: { toArray: async () => [] },
					totalCount: Promise.resolve(0),
				});

				const result = await service.listAbacAttributes({ key: 'nope', values: 'none' });
				expect(result).toEqual({
					attributes: [],
					offset: 0,
					count: 0,
					total: 0,
				});
			});
		});
	});

	describe('updateAbacAttributeById', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockAbacUpdateOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});

		it('returns early (no-op) when neither key nor values provided', async () => {
			await service.updateAbacAttributeById('id1', {} as any);
			expect(mockAbacFindOne).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('throws error-attribute-not-found when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			await expect(service.updateAbacAttributeById('idMissing', { key: 'newKey' })).rejects.toThrow('error-attribute-not-found');
			expect(mockAbacFindOne).toHaveBeenCalledWith('idMissing', { projection: { key: 1, values: 1 } });
		});

		it('updates key even if format contains spaces (no validation in service)', async () => {
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id2', key: 'OldKey', values: ['a'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id2', { key: 'Invalid Key!' });
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id2' }, { $set: { key: 'Invalid Key!' } });
		});

		it('throws error-invalid-attribute-values for empty values array', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id3', key: 'Key3', values: ['x'] });
			await expect(service.updateAbacAttributeById('id3', { values: [] })).rejects.toThrow('error-invalid-attribute-values');
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
		});

		it('throws error-attribute-in-use when key changes and old definition is in use', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id4', key: 'Old', values: ['v1', 'v2'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
			await expect(service.updateAbacAttributeById('id4', { key: 'New' })).rejects.toThrow('error-attribute-in-use');
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Old', ['v1', 'v2']);
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
		});

		it('updates key when changed and not in use', async () => {
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id5', key: 'Old', values: ['a'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id5', { key: 'NewKey' });
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id5' }, { $set: { key: 'NewKey' } });
		});

		it('throws error-attribute-in-use when removing a value that is in use', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id6', key: 'Attr', values: ['a', 'b', 'c'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true); // removed value in use
			await expect(service.updateAbacAttributeById('id6', { values: ['a', 'c'] })).rejects.toThrow('error-attribute-in-use');
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Attr', ['b']);
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
		});

		it('updates values when removing some that are not in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id7', key: 'Attr', values: ['a', 'b', 'c'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false); // removal safe
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id7', { values: ['a', 'c'] });
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id7' }, { $set: { values: ['a', 'c'] } });
		});

		it('updates values when only adding (no removal) without in-use check', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id8', key: 'Attr', values: ['a'] });
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id8', { values: ['a', 'b'] });
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id8' }, { $set: { values: ['a', 'b'] } });
		});

		it('throws error-duplicate-attribute-key on duplicate key error', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id9', key: 'Old', values: ['v'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockRejectedValueOnce(new Error('E11000 duplicate key error collection'));
			await expect(service.updateAbacAttributeById('id9', { key: 'NewKey' })).rejects.toThrow('error-duplicate-attribute-key');
		});

		it('propagates unexpected update errors', async () => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
			mockAbacUpdateOne.mockReset();
			mockAbacFindOne
				.mockResolvedValueOnce({ _id: 'id10', key: 'Old', values: ['v'] }) // findOneById
				.mockResolvedValueOnce(null); // duplicate key check
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockRejectedValueOnce(new Error('write-failed'));
			await expect(service.updateAbacAttributeById('id10', { key: 'Another' })).rejects.toThrow('write-failed');
		});

		describe('deleteAbacAttributeById', () => {
			beforeEach(() => {
				mockAbacFindOne.mockReset();
				mockAbacDeleteOne.mockReset();
				mockRoomsIsAbacAttributeInUse.mockReset();
			});

			it('throws error-attribute-not-found when attribute does not exist', async () => {
				mockAbacFindOne.mockReset();
				mockRoomsIsAbacAttributeInUse.mockReset();
				mockAbacDeleteOne.mockReset();
				mockAbacFindOne.mockResolvedValueOnce(null);
				await expect(service.deleteAbacAttributeById('missing')).rejects.toThrow('error-attribute-not-found');
			});

			it('throws error-attribute-in-use when attribute is referenced by a room', async () => {
				mockAbacFindOne.mockReset();
				mockRoomsIsAbacAttributeInUse.mockReset();
				mockAbacDeleteOne.mockReset();
				mockAbacFindOne.mockResolvedValueOnce({ _id: 'id11', key: 'KeyInUse', values: ['a', 'b'] });
				mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
				await expect(service.deleteAbacAttributeById('id11')).rejects.toThrow('error-attribute-in-use');
				expect(mockAbacDeleteOne).not.toHaveBeenCalled();
			});

			it('deletes attribute when not in use', async () => {
				mockAbacFindOne.mockReset();
				mockRoomsIsAbacAttributeInUse.mockReset();
				mockAbacDeleteOne.mockReset();
				mockAbacFindOne.mockResolvedValueOnce({ _id: 'id12', key: 'FreeKey', values: ['x'] });
				mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
				mockAbacDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });
				await service.deleteAbacAttributeById('id12');
				expect(mockAbacDeleteOne).toHaveBeenCalledWith('id12');
			});
		});
	});
	describe('getAbacAttributeById', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});
		it('throws error-attribute-not-found when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			await expect(service.getAbacAttributeById('missingAttr')).rejects.toThrow('error-attribute-not-found');
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('returns attribute with per-value usage map', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id13', key: 'Attr', values: ['a', 'b', 'c'] });
			// Usage results for each value
			mockRoomsIsAbacAttributeInUse
				.mockResolvedValueOnce(true) // a
				.mockResolvedValueOnce(false) // b
				.mockResolvedValueOnce(true); // c

			const result = await service.getAbacAttributeById('id13');
			expect(mockAbacFindOne).toHaveBeenCalledWith('id13', { projection: { key: 1, values: 1 } });
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenNthCalledWith(1, 'Attr', ['a']);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenNthCalledWith(2, 'Attr', ['b']);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenNthCalledWith(3, 'Attr', ['c']);

			expect(result).toEqual({
				_id: 'id13',
				key: 'Attr',
				values: ['a', 'b', 'c'],
				usage: { a: true, b: false, c: true },
			});
		});

		describe('setRoomAbacAttributes', () => {
			// Using top-level mocks (mockSetAbacAttributesById, mockAbacFind) defined in jest.mock factory above

			beforeEach(() => {
				mockSetAbacAttributesById.mockReset();
				mockAbacFind.mockReset();
				mockFindOneByIdAndType.mockReset();
				mockRoomsIsAbacAttributeInUse.mockReset();
				// Provide a default empty cursor so AbacAttributes.find always returns an object with toArray
				mockAbacFind.mockReturnValue({ toArray: async () => [] });
				// Prevent the protected hook from throwing
				(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
			});

			it('throws error-room-not-found when room does not exist', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce(null);
				await expect(service.setRoomAbacAttributes('missing', { dept: ['eng'] })).rejects.toThrow('error-room-not-found');
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('throws error-invalid-attribute-key for invalid key format', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				await expect(service.setRoomAbacAttributes('r1', { 'bad key': ['v'] } as any)).rejects.toThrow('error-invalid-attribute-key');
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('throws error-attribute-definition-not-found for empty value array', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				await expect(service.setRoomAbacAttributes('r1', { dept: [] as any })).rejects.toThrow('error-attribute-definition-not-found');
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('throws error-attribute-definition-not-found when definition for key missing', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				// Return empty list so size mismatch triggers not-found
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [] });
				await expect(service.setRoomAbacAttributes('r1', { dept: ['eng'] })).rejects.toThrow('error-attribute-definition-not-found');
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('throws error-invalid-attribute-values when a provided value not in definition', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				mockAbacFind.mockReturnValueOnce({
					toArray: async () => [{ key: 'dept', values: ['eng'] }], // 'sales' not allowed
				});
				await expect(service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] })).rejects.toThrow('error-invalid-attribute-values');
				expect(mockSetAbacAttributesById).not.toHaveBeenCalled();
			});

			it('accepts duplicate values unchanged and sets attributes', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				mockAbacFind.mockReturnValueOnce({
					toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
				});

				await service.setRoomAbacAttributes('r1', { dept: ['eng', 'eng', 'sales'] });

				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng', 'eng', 'sales'] }]);
				expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
			});

			it('calls onRoomAttributesChanged when an existing value is removed', async () => {
				const existing = [{ key: 'dept', values: ['eng', 'sales'] }];
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				mockAbacFind.mockReturnValueOnce({
					toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
				});

				await service.setRoomAbacAttributes('r1', { dept: ['eng'] }); // removing 'sales'

				expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng'] }]);
				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng'] }]);
			});

			it('does not call onRoomAttributesChanged when only adding values', async () => {
				const existing = [{ key: 'dept', values: ['eng'] }];
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				mockAbacFind.mockReturnValueOnce({
					toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }],
				});

				await service.setRoomAbacAttributes('r1', { dept: ['eng', 'sales'] }); // adding sales

				expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
				expect(mockSetAbacAttributesById).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng', 'sales'] }]);
			});
		});
	});

	describe('isAbacAttributeInUseByKey', () => {
		beforeEach(() => {
			mockAbacFindOne.mockReset();
			mockRoomsIsAbacAttributeInUse.mockReset();
		});
		it('returns false when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			const result = await service.isAbacAttributeInUseByKey('missing');
			expect(result).toBe(false);
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('returns false when attribute exists but has no values', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id14', key: 'Empty', values: [] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			const result = await service.isAbacAttributeInUseByKey('Empty');
			expect(result).toBe(false);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Empty', []);
		});

		it('returns true when any value is in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id15', key: 'Attr2', values: ['x', 'y'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
			const result = await service.isAbacAttributeInUseByKey('Attr2');
			expect(result).toBe(true);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Attr2', ['x', 'y']);
		});

		it('returns false when no values are in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id16', key: 'Attr3', values: ['m', 'n'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			const result = await service.isAbacAttributeInUseByKey('Attr3');
			expect(result).toBe(false);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Attr3', ['m', 'n']);
		});
	});

	describe('updateRoomAbacAttributeValues', () => {
		beforeEach(() => {
			mockFindOneByIdAndType.mockReset();
			mockUpdateSingleAbacAttributeValuesById.mockReset();
			mockUpdateAbacAttributeValuesArrayFilteredById.mockReset();
			mockAbacFind.mockReset();
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
			// default definition cursor
			mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] });
		});

		it('throws error-room-not-found if room missing', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect(service.updateRoomAbacAttributeValues('missing', 'dept', ['eng'])).rejects.toThrow('error-room-not-found');
		});

		it('throws error-invalid-attribute-values if adding new key exceeds max attributes', async () => {
			const existing = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, values: ['x'] }));
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			await expect(service.updateRoomAbacAttributeValues('r1', 'newKey', ['val'])).rejects.toThrow('error-invalid-attribute-values');
		});

		it('adds new key using updateSingleAbacAttributeValuesById when within limit', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'other', values: ['x'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng']);
			expect(mockUpdateSingleAbacAttributeValuesById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
		});

		it('does nothing when values array is identical (no update, no hook)', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales']);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('updates existing key (addition only) without triggering removal hook', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales']);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng', 'sales']);
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('updates existing key and triggers hook when a value is removed', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
			await service.updateRoomAbacAttributeValues('r1', 'dept', ['eng']);
			expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', [{ key: 'dept', values: ['eng'] }]);
		});

		it('validates against global definitions (invalid value)', async () => {
			mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
			await expect(service.updateRoomAbacAttributeValues('r1', 'dept', ['eng', 'sales'])).rejects.toThrow('error-invalid-attribute-values');
		});
	});

	describe('removeRoomAbacAttribute', () => {
		beforeEach(() => {
			mockFindOneByIdAndType.mockReset();
			mockRemoveAbacAttributeByRoomIdAndKey.mockReset();
			(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
		});

		it('throws error-room-not-found when room does not exist', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);
			await expect((service as any).removeRoomAbacAttribute('missing', 'dept')).rejects.toThrow('error-room-not-found');
			expect(mockRemoveAbacAttributeByRoomIdAndKey).not.toHaveBeenCalled();
		});

		it('returns early (no update, no hook) when attribute key not present', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [{ key: 'other', values: ['x'] }] });
			await (service as any).removeRoomAbacAttribute('r1', 'dept');
			expect(mockRemoveAbacAttributeByRoomIdAndKey).not.toHaveBeenCalled();
			expect((service as any).onRoomAttributesChanged).not.toHaveBeenCalled();
		});

		it('removes attribute and calls hook when key exists', async () => {
			const existing = [
				{ key: 'dept', values: ['eng', 'sales'] },
				{ key: 'other', values: ['x'] },
			];
			mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
			await (service as any).removeRoomAbacAttribute('r1', 'dept');
			expect(mockRemoveAbacAttributeByRoomIdAndKey).toHaveBeenCalledWith('r1', 'dept');
			expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', [{ key: 'other', values: ['x'] }]);
		});

		describe('replaceRoomAbacAttributeByKey', () => {
			beforeEach(() => {
				mockFindOneByIdAndType.mockReset();
				mockUpdateAbacAttributeValuesArrayFilteredById.mockReset();
				mockInsertAbacAttributeIfNotExistsById.mockReset();
				mockAbacFind.mockReset();
				(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
				// default attribute definitions
				mockAbacFind.mockReturnValue({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] });
			});

			it('throws error-invalid-attribute-values when more than 10 values provided', async () => {
				const values = Array.from({ length: 11 }, (_, i) => `v${i}`);
				await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', values)).rejects.toThrow(
					'error-invalid-attribute-values',
				);
			});

			it('throws error-room-not-found if room missing', async () => {
				mockFindOneByIdAndType.mockResolvedValueOnce(null);
				await expect((service as any).replaceRoomAbacAttributeByKey('missing', 'dept', ['eng'])).rejects.toThrow('error-room-not-found');
			});

			it('throws error-invalid-attribute-values if adding new key exceeds max attributes', async () => {
				const existing = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, values: ['x'] }));
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng'])).rejects.toThrow(
					'error-invalid-attribute-values',
				);
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			});

			it('adds new key when under limit (calls insert and hook)', async () => {
				const existing = [{ key: 'other', values: ['x'] }];
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				const updatedDoc = { abacAttributes: [...existing, { key: 'dept', values: ['eng'] }] };
				mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(updatedDoc);

				await (service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng']);

				expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
				expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
				expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', updatedDoc.abacAttributes);
			});

			it('replaces existing key (calls update and hook)', async () => {
				const existing = [{ key: 'dept', values: ['eng'] }];
				const updatedDoc = { abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] };
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				mockUpdateAbacAttributeValuesArrayFilteredById.mockResolvedValueOnce(updatedDoc);

				await (service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales']);

				expect(mockUpdateAbacAttributeValuesArrayFilteredById).toHaveBeenCalledWith('r1', 'dept', ['eng', 'sales']);
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
				expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', updatedDoc.abacAttributes);
			});

			it('validates definitions and rejects invalid value', async () => {
				// Only 'eng' allowed for dept
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });

				await expect((service as any).replaceRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'])).rejects.toThrow(
					'error-invalid-attribute-values',
				);
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
				expect(mockUpdateAbacAttributeValuesArrayFilteredById).not.toHaveBeenCalled();
			});
		});

		describe('addRoomAbacAttributeByKey', () => {
			beforeEach(() => {
				mockFindOneByIdAndType.mockReset();
				mockInsertAbacAttributeIfNotExistsById.mockReset();
				mockAbacFind.mockReset();
				(service as any).onRoomAttributesChanged = jest.fn().mockResolvedValue(undefined);
			});

			it('throws error-room-not-found when room does not exist', async () => {
				// Ensure definitions exist to pass definition check, but room missing
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce(null);
				await expect(service.addRoomAbacAttributeByKey('missing', 'dept', ['eng'])).rejects.toThrow('error-room-not-found');
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			});

			it('throws error-attribute-definition-not-found when attribute definition missing', async () => {
				// No definitions returned
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [] });
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'])).rejects.toThrow('error-attribute-definition-not-found');
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			});

			it('throws error-duplicate-attribute-key when key already exists in room', async () => {
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce({
					_id: 'r1',
					abacAttributes: [{ key: 'dept', values: ['eng'] }],
				});
				await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['sales'])).rejects.toThrow('error-duplicate-attribute-key');
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			});

			it('throws error-invalid-attribute-values when room already has 10 attributes', async () => {
				const existing = Array.from({ length: 10 }, (_, i) => ({ key: `k${i}`, values: ['x'] }));
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng'])).rejects.toThrow('error-invalid-attribute-values');
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			});

			it('inserts new attribute and calls hook with DB returned document', async () => {
				const existing = [{ key: 'other', values: ['x'] }];
				const updatedDoc = { abacAttributes: [...existing, { key: 'dept', values: ['eng', 'sales'] }] };
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng', 'sales'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(updatedDoc);

				await service.addRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales']);

				expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng', 'sales']);
				expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', updatedDoc.abacAttributes);
			});

			it('inserts new attribute and calls hook with constructed list when DB returns undefined', async () => {
				const existing = [{ key: 'other', values: ['x'] }];
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: existing });
				mockInsertAbacAttributeIfNotExistsById.mockResolvedValueOnce(undefined);

				await service.addRoomAbacAttributeByKey('r1', 'dept', ['eng']);

				expect(mockInsertAbacAttributeIfNotExistsById).toHaveBeenCalledWith('r1', 'dept', ['eng']);
				expect((service as any).onRoomAttributesChanged).toHaveBeenCalledWith('r1', [...existing, { key: 'dept', values: ['eng'] }]);
			});

			it('rejects when provided value not allowed by definition', async () => {
				mockAbacFind.mockReturnValueOnce({ toArray: async () => [{ key: 'dept', values: ['eng'] }] });
				mockFindOneByIdAndType.mockResolvedValueOnce({ _id: 'r1', abacAttributes: [] });
				await expect(service.addRoomAbacAttributeByKey('r1', 'dept', ['eng', 'sales'])).rejects.toThrow('error-invalid-attribute-values');
				expect(mockInsertAbacAttributeIfNotExistsById).not.toHaveBeenCalled();
			});
		});
	});
});
