import type { Db } from 'mongodb';

import { MessagesRaw } from './Messages';

jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

describe('MessagesRaw.setAttachmentTranscription', () => {
	it('sets attachments.<index>.transcription', async () => {
		const updateOne = jest.fn().mockResolvedValue({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
		const createIndexes = jest.fn().mockResolvedValue(undefined);
		const model = new MessagesRaw({
			collection: () => ({ updateOne, createIndexes }),
		} as unknown as Db);

		await model.setAttachmentTranscription('mid-1', 2, {
			status: 'done',
			text: 'hello',
			provider: 'whisper-cpp-server',
		});

		expect(updateOne).toHaveBeenCalledWith(
			{ _id: 'mid-1' },
			expect.objectContaining({
				$set: expect.objectContaining({
					'attachments.2.transcription': {
						status: 'done',
						text: 'hello',
						provider: 'whisper-cpp-server',
					},
				}),
			}),
		);
	});
});
