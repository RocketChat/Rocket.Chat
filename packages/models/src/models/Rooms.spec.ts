import type { Db } from 'mongodb';

import { RoomsRaw } from './Rooms';

jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: jest.requireActual('../updater').UpdaterImpl,
}));

describe('RoomsRaw', () => {
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
			expect(executedQuery.teamId).toEqual({ $exists: false });
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
			expect(executedQuery.teamId).toEqual({ $exists: false });
		});
	});
});
