import type { IMessage } from '@rocket.chat/core-typings';

import { applyDeleteMessageBulkToSearchIndex } from './searchIndexDeletes';
import type { SearchIndexWriter } from './searchIndexWriter';

const createWriter = () =>
	({
		index: jest.fn(),
		remove: jest.fn<Promise<void>, Parameters<SearchIndexWriter['remove']>>(async () => undefined),
		flush: jest.fn<Promise<void>, []>(async () => undefined),
		dispose: jest.fn(),
	}) as jest.Mocked<SearchIndexWriter>;

const decrypted = (id: string): IMessage =>
	({
		_id: id,
		rid: 'room1',
		t: 'e2e',
		e2e: 'done',
		msg: 'text that stays',
		u: { _id: 'u1', username: 'alice' },
		ts: new Date('2026-10-26T12:00:00Z'),
		_updatedAt: new Date('2026-10-26T12:00:00Z'),
	}) as IMessage;

describe('applyDeleteMessageBulkToSearchIndex', () => {
	it('removes each deleted message (prune, retention)', async () => {
		const writer = createWriter();

		await applyDeleteMessageBulkToSearchIndex({ rid: 'room1', ids: ['m1', 'm2'] }, { writer, findMessage: () => undefined });

		expect(writer.remove).toHaveBeenCalledWith(['m1', 'm2']);
	});

	it('removes the messages that show a deleted status (moderation)', async () => {
		const writer = createWriter();

		await applyDeleteMessageBulkToSearchIndex(
			{ rid: 'room1', ids: ['m1'], showDeletedStatus: true },
			{ writer, findMessage: () => decrypted('m1') },
		);

		expect(writer.remove).toHaveBeenCalledWith(['m1']);
		expect(writer.index).not.toHaveBeenCalled();
	});

	it('indexes again a loaded message whose files were pruned, so the file names leave the index', async () => {
		const writer = createWriter();
		const loaded = decrypted('m1');

		await applyDeleteMessageBulkToSearchIndex(
			{ rid: 'room1', ids: ['m1', 'not-loaded'], filesOnly: true },
			{ writer, findMessage: (id) => (id === 'm1' ? loaded : undefined) },
		);

		expect(writer.index).toHaveBeenCalledWith(loaded);
		expect(writer.remove).toHaveBeenCalledWith(['not-loaded'], { deleted: false });
	});

	it('removes a loaded message that has no text left after its files were pruned', async () => {
		const writer = createWriter();
		const fileOnly = { ...decrypted('m1'), msg: '', attachments: [], files: [] } as IMessage;

		await applyDeleteMessageBulkToSearchIndex({ rid: 'room1', ids: ['m1'], filesOnly: true }, { writer, findMessage: () => fileOnly });

		expect(writer.index).not.toHaveBeenCalled();
		expect(writer.remove).toHaveBeenCalledWith(['m1'], { deleted: false });
	});

	it('does nothing for an event with no message ids', async () => {
		const writer = createWriter();

		await applyDeleteMessageBulkToSearchIndex({ rid: 'room1' }, { writer, findMessage: () => undefined });

		expect(writer.remove).not.toHaveBeenCalled();
		expect(writer.index).not.toHaveBeenCalled();
	});
});
