import { AbacService } from './index';

const mockFindOneByIdAndType = jest.fn();
const mockUpdateAbacConfigurationById = jest.fn();
const mockAbacInsertOne = jest.fn();
const mockAbacFindPaginated = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Rooms: {
		findOneByIdAndType: (...args: any[]) => mockFindOneByIdAndType(...args),
		updateAbacConfigurationById: (...args: any[]) => mockUpdateAbacConfigurationById(...args),
	},
	AbacAttributes: {
		insertOne: (...args: any[]) => mockAbacInsertOne(...args),
		findPaginated: (...args: any[]) => mockAbacFindPaginated(...args),
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

	describe('toggleAbacConfigurationForRoom', () => {
		it('enables ABAC when room.abac is undefined', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'room1',
				t: 'p',
				abac: undefined,
			});

			await service.toggleAbacConfigurationForRoom('room1');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('room1', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).toHaveBeenCalledWith('room1', true);
		});

		it('enables ABAC when room.abac is false', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'room2',
				t: 'p',
				abac: false,
			});

			await service.toggleAbacConfigurationForRoom('room2');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('room2', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).toHaveBeenCalledWith('room2', true);
		});

		it('disables ABAC when room.abac is true', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce({
				_id: 'room3',
				t: 'p',
				abac: true,
			});

			await service.toggleAbacConfigurationForRoom('room3');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('room3', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).toHaveBeenCalledWith('room3', false);
		});

		it('throws error-invalid-room when room is not found', async () => {
			mockFindOneByIdAndType.mockResolvedValueOnce(null);

			await expect(service.toggleAbacConfigurationForRoom('missing')).rejects.toThrow('error-invalid-room');

			expect(mockFindOneByIdAndType).toHaveBeenCalledWith('missing', 'p', { projection: { abac: 1 } });
			expect(mockUpdateAbacConfigurationById).not.toHaveBeenCalled();
		});

		it('propagates underlying model errors', async () => {
			const err = new Error('database-failure');
			mockFindOneByIdAndType.mockRejectedValueOnce(err);

			await expect(service.toggleAbacConfigurationForRoom('roomX')).rejects.toThrow('database-failure');
			expect(mockUpdateAbacConfigurationById).not.toHaveBeenCalled();
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
					expect(mockAbacFindPaginated).toHaveBeenCalledWith(
						{ key: 'FilterKey' },
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
	});
});
