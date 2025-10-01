import { AbacService } from './index';

const mockFindOneByIdAndType = jest.fn();
const mockUpdateAbacConfigurationById = jest.fn();
const mockAbacInsertOne = jest.fn();
const mockAbacFindPaginated = jest.fn();
const mockAbacFindOne = jest.fn();
const mockAbacUpdateOne = jest.fn();
const mockAbacDeleteOne = jest.fn();
const mockRoomsIsAbacAttributeInUse = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		updateAbacConfigurationById: (...args: any[]) => mockUpdateAbacConfigurationById(...args),
		isAbacAttributeInUse: (...args: any[]) => mockRoomsIsAbacAttributeInUse(...args),
	},
	AbacAttributes: {
		insertOne: (...args: any[]) => mockAbacInsertOne(...args),
		findPaginated: (...args: any[]) => mockAbacFindPaginated(...args),
		findOne: (...args: any[]) => mockAbacFindOne(...args),
		updateOne: (...args: any[]) => mockAbacUpdateOne(...args),
		deleteOne: (...args: any[]) => mockAbacDeleteOne(...args),
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

		it('throws error-invalid-attribute-key for invalid key', async () => {
			const attribute = { key: 'Invalid Key!', values: ['v1'] };
			await expect(service.addAbacAttribute(attribute as any)).rejects.toThrow('error-invalid-attribute-key');
			expect(mockAbacInsertOne).not.toHaveBeenCalled();
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
				expect(mockAbacFindPaginated).toHaveBeenCalledWith({ key: 'FilterKey' }, { projection: { key: 1, values: 1 }, skip: 0, limit: 25 });
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

				const result = await service.listAbacAttributes({ values: ['n', 'z'], offset: 5, count: 2 });
				expect(mockAbacFindPaginated).toHaveBeenCalledWith(
					{ values: { $in: ['n', 'z'] } },
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

				const result = await service.listAbacAttributes({ key: 'gamma', values: ['q'] });
				expect(mockAbacFindPaginated).toHaveBeenCalledWith(
					{ key: 'gamma', values: { $in: ['q'] } },
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

				const result = await service.listAbacAttributes({ key: 'nope', values: ['none'] });
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
		it('returns early (no-op) when neither key nor values provided', async () => {
			await service.updateAbacAttributeById('id1', {} as any);
			expect(mockAbacFindOne).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
		});

		it('throws error-attribute-not-found when attribute does not exist', async () => {
			mockAbacFindOne.mockResolvedValueOnce(null);
			await expect(service.updateAbacAttributeById('idMissing', { key: 'newKey' })).rejects.toThrow('error-attribute-not-found');
			expect(mockAbacFindOne).toHaveBeenCalledWith({ _id: 'idMissing' }, { projection: { key: 1, values: 1 } });
		});

		it('throws error-invalid-attribute-key for invalid new key', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id2', key: 'OldKey', values: ['a'] });
			await expect(service.updateAbacAttributeById('id2', { key: 'Invalid Key!' })).rejects.toThrow('error-invalid-attribute-key');
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
		});

		it('throws error-invalid-attribute-values for empty values array', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id3', key: 'Key3', values: ['x'] });
			await expect(service.updateAbacAttributeById('id3', { values: [] })).rejects.toThrow('error-invalid-attribute-values');
			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
		});

		it('throws error-attribute-in-use when key changes and old definition is in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id4', key: 'Old', values: ['v1', 'v2'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
			await expect(service.updateAbacAttributeById('id4', { key: 'New' })).rejects.toThrow('error-attribute-in-use');
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenCalledWith('Old', ['v1', 'v2']);

			expect(mockAbacUpdateOne).not.toHaveBeenCalled();
		});

		it('updates key when changed and not in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id5', key: 'Old', values: ['a'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id5', { key: 'NewKey' });
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id5' }, { $set: { key: 'NewKey' } });
		});

		it('throws error-attribute-in-use when removing a value that is in use', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id6', key: 'Attr', values: ['a', 'b', 'c'] });
			// removedValues => ['b']
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
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
			// newValues = ['a','b'] => removedValues = []
			mockAbacUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			await service.updateAbacAttributeById('id8', { values: ['a', 'b'] });
			expect(mockRoomsIsAbacAttributeInUse).not.toHaveBeenCalled();
			expect(mockAbacUpdateOne).toHaveBeenCalledWith({ _id: 'id8' }, { $set: { values: ['a', 'b'] } });
		});

		it('throws error-duplicate-attribute-key on duplicate key error', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id9', key: 'Old', values: ['v'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockRejectedValueOnce(new Error('E11000 duplicate key error collection'));
			await expect(service.updateAbacAttributeById('id9', { key: 'NewKey' })).rejects.toThrow('error-duplicate-attribute-key');
		});

		it('propagates unexpected update errors', async () => {
			mockAbacFindOne.mockResolvedValueOnce({ _id: 'id10', key: 'Old', values: ['v'] });
			mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
			mockAbacUpdateOne.mockRejectedValueOnce(new Error('write-failed'));
			await expect(service.updateAbacAttributeById('id10', { key: 'Another' })).rejects.toThrow('write-failed');
		});
		describe('deleteAbacAttributeById', () => {
			it('throws error-attribute-not-found when attribute does not exist', async () => {
				mockAbacFindOne.mockResolvedValueOnce(null);
				await expect(service.deleteAbacAttributeById('missing')).rejects.toThrow('error-attribute-not-found');
			});

			it('throws error-attribute-in-use when attribute is referenced by a room', async () => {
				mockAbacFindOne.mockResolvedValueOnce({ _id: 'id11', key: 'KeyInUse', values: ['a', 'b'] });
				mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(true);
				await expect(service.deleteAbacAttributeById('id11')).rejects.toThrow('error-attribute-in-use');
				expect(mockAbacDeleteOne).not.toHaveBeenCalled();
			});

			it('deletes attribute when not in use', async () => {
				mockAbacFindOne.mockResolvedValueOnce({ _id: 'id12', key: 'FreeKey', values: ['x'] });
				mockRoomsIsAbacAttributeInUse.mockResolvedValueOnce(false);
				mockAbacDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });
				await service.deleteAbacAttributeById('id12');
				expect(mockAbacDeleteOne).toHaveBeenCalledWith({ _id: 'id12' });
			});
		});
	});
	describe('getAbacAttributeById', () => {
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
			expect(mockAbacFindOne).toHaveBeenCalledWith({ _id: 'id13' }, { projection: { key: 1, values: 1 } });
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenNthCalledWith(1, 'Attr', ['a']);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenNthCalledWith(2, 'Attr', ['b']);
			expect(mockRoomsIsAbacAttributeInUse).toHaveBeenNthCalledWith(3, 'Attr', ['c']);

			expect(result).toEqual({
				attribute: { _id: 'id13', key: 'Attr', values: ['a', 'b', 'c'] },
				usage: { a: true, b: false, c: true },
			});
		});
	});
});
