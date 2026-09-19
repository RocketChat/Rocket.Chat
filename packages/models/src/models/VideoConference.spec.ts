import type { Db } from 'mongodb';

import { VideoConferenceRaw } from './VideoConference';

// `VideoConference` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: jest.requireActual('../updater').UpdaterImpl,
}));

const db = { collection: () => ({ createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;

describe('VideoConferenceRaw', () => {
	const model = new VideoConferenceRaw(db);

	describe('setDiscussionRidById', () => {
		it('should call updateOneById with the callId and $set discussionRid', async () => {
			const spy = jest.spyOn(model, 'updateOneById').mockResolvedValue({} as any);

			await model.setDiscussionRidById('call-123', 'discussion-456');

			expect(spy).toHaveBeenCalledWith('call-123', {
				$set: {
					discussionRid: 'discussion-456',
				},
			});

			spy.mockRestore();
		});
	});

	describe('unsetDiscussionRidById', () => {
		it('should call updateOneById with the callId and $unset discussionRid as 1', async () => {
			const spy = jest.spyOn(model, 'updateOneById').mockResolvedValue({} as any);

			await model.unsetDiscussionRidById('call-123');

			expect(spy).toHaveBeenCalledWith('call-123', {
				$unset: {
					discussionRid: 1,
				},
			});

			spy.mockRestore();
		});
	});
});
