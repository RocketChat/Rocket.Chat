import type { Db } from 'mongodb';

import { LivechatInquiryRaw } from './LivechatInquiry';

// `LivechatInquiry` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const findOneAndUpdate = jest.fn();
const db = {
	collection: () => ({ findOneAndUpdate, createIndexes: jest.fn().mockResolvedValue(undefined) }),
} as unknown as Db;

describe('markInquiryActiveForPeriod', () => {
	it('should use a pipeline update that tolerates a null activity', async () => {
		await new LivechatInquiryRaw(db).markInquiryActiveForPeriod('rid1', '2026-09');

		expect(findOneAndUpdate).toHaveBeenCalledWith({ rid: 'rid1' }, [
			{ $set: { 'v.activity': { $setUnion: [{ $ifNull: ['$v.activity', []] }, ['2026-09']] }, '_updatedAt': '$$NOW' } },
		]);
	});
});
