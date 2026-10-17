import type { Db } from 'mongodb';

import { RoomsRaw } from './Rooms';

jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: jest.requireActual('../updater').UpdaterImpl,
}));

describe('RoomsRaw', () => {
	describe('modelIndexes', () => {
		it('should register a case-insensitive index on name with collation', () => {
			const db = {
				collection: () => ({
					createIndexes: jest.fn().mockResolvedValue(undefined),
				}),
			} as unknown as Db;
			const model = new RoomsRaw(db);
			const indexes = model.modelIndexes();

			expect(indexes).toContainEqual(
				expect.objectContaining({
					key: { name: 1 },
					name: 'name_insensitive',
					collation: { locale: 'en', strength: 2 },
				}),
			);
		});
	});

	describe('findOneByNameAndType', () => {
		it('should query with scalar equality when type is a single string', async () => {
			let executedQuery: any;
			const db = {
				collection: () => ({
					createIndexes: jest.fn().mockResolvedValue(undefined),
					findOne: jest.fn().mockImplementation((query) => {
						executedQuery = query;
						return Promise.resolve(null);
					}),
				}),
			} as unknown as Db;

			const model = new RoomsRaw(db);
			await model.findOneByNameAndType('general', 'c');

			expect(executedQuery.t).toBe('c');
			expect(executedQuery.$and[0]).toEqual({
				$or: [{ teamId: { $exists: false } }, { teamMain: true, t: 'c' }],
			});
		});

		it('should query with $in operator when type is an array of room types', async () => {
			let executedQuery: any;
			const db = {
				collection: () => ({
					createIndexes: jest.fn().mockResolvedValue(undefined),
					findOne: jest.fn().mockImplementation((query) => {
						executedQuery = query;
						return Promise.resolve(null);
					}),
				}),
			} as unknown as Db;

			const model = new RoomsRaw(db);
			await model.findOneByNameAndType('general', ['c', 'p']);

			expect(executedQuery.t).toEqual({ $in: ['c', 'p'] });
			expect(executedQuery.$and[0]).toEqual({
				$or: [{ teamId: { $exists: false } }, { teamMain: true, t: 'c' }],
			});
		});

		it('should not pass collation options by default to preserve case sensitivity', async () => {
			let executedOptions: any;
			const db = {
				collection: () => ({
					createIndexes: jest.fn().mockResolvedValue(undefined),
					findOne: jest.fn().mockImplementation((_query, options) => {
						executedOptions = options;
						return Promise.resolve(null);
					}),
				}),
			} as unknown as Db;

			const model = new RoomsRaw(db);
			await model.findOneByNameAndType('General', 'c');

			expect(executedOptions?.collation).toBeUndefined();
		});

		it('should pass case-insensitive collation options to findOne when caseInsensitive is true', async () => {
			let executedOptions: any;
			const db = {
				collection: () => ({
					createIndexes: jest.fn().mockResolvedValue(undefined),
					findOne: jest.fn().mockImplementation((_query, options) => {
						executedOptions = options;
						return Promise.resolve(null);
					}),
				}),
			} as unknown as Db;

			const model = new RoomsRaw(db);
			await model.findOneByNameAndType('General', 'c', undefined, false, true);

			expect(executedOptions?.collation).toEqual({ locale: 'en', strength: 2 });
		});
	});
});
