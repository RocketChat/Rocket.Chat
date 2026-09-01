import type { Db } from 'mongodb';

import { LivechatRoomsRaw } from './LivechatRooms';
import { UpdaterImpl } from '../updater';

// `LivechatRooms` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: jest.requireActual('../updater').UpdaterImpl,
}));

const db = { collection: () => ({ createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;

describe('getVisitorActiveForPeriodUpdateQuery', () => {
	const model = new LivechatRoomsRaw(db);

	it('should $addToSet the period when the current activity is an array', () => {
		const updater = model.getVisitorActiveForPeriodUpdateQuery('2026-09', new UpdaterImpl(), ['2026-08']);

		expect(updater.getRawUpdateFilter()).toEqual({ $addToSet: { 'v.activity': { $each: ['2026-09'] } } });
	});

	it('should $addToSet the period when the current activity is absent', () => {
		const updater = model.getVisitorActiveForPeriodUpdateQuery('2026-09', new UpdaterImpl(), undefined);

		expect(updater.getRawUpdateFilter()).toEqual({ $addToSet: { 'v.activity': { $each: ['2026-09'] } } });
	});

	it('should $set the period when the current activity is null', () => {
		const updater = model.getVisitorActiveForPeriodUpdateQuery('2026-09', new UpdaterImpl(), null);

		expect(updater.getRawUpdateFilter()).toEqual({ $set: { 'v.activity': ['2026-09'] } });
	});
});
