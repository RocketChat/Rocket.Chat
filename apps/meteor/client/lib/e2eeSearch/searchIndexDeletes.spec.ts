import type { IMessage } from '@rocket.chat/core-typings';

import { applyDeleteMessageBulkToSearchIndex } from './searchIndexDeletes';

const message = (id: string, msg = 'remaining text'): IMessage =>
	({
		_id: id,
		rid: 'room',
		t: 'e2e',
		e2e: 'done',
		msg,
		u: { _id: 'u', username: 'alice' },
		ts: new Date(1000),
		_updatedAt: new Date(1000),
	}) as IMessage;
const setup = () => ({ writer: { index: jest.fn(), remove: jest.fn(async () => undefined) }, findMessage: jest.fn() });

describe('bulk deletion indexing', () => {
	it.each([false, true])('removes deleted IDs with placeholders=%p', async (showDeletedStatus) => {
		const dependencies = setup();
		await applyDeleteMessageBulkToSearchIndex({ rid: 'room', ids: ['a', 'b'], showDeletedStatus }, dependencies);
		expect(dependencies.writer.remove).toHaveBeenCalledWith(['a', 'b']);
		expect(dependencies.writer.index).not.toHaveBeenCalled();
	});

	it('reindexes remaining text and removes unloaded or empty file-only edits without tombstones', async () => {
		const dependencies = setup();
		const loaded = message('loaded');
		dependencies.findMessage.mockImplementation((id) => {
			if (id === 'loaded') return loaded;
			if (id === 'empty') return message('empty', '');
			return undefined;
		});
		await applyDeleteMessageBulkToSearchIndex({ rid: 'room', ids: ['loaded', 'empty', 'absent'], filesOnly: true }, dependencies);
		expect(dependencies.writer.index).toHaveBeenCalledWith(loaded);
		expect(dependencies.writer.remove).toHaveBeenCalledWith(['empty', 'absent'], { deleted: false });
	});

	it('does not write for missing IDs', async () => {
		const dependencies = setup();
		await applyDeleteMessageBulkToSearchIndex({ rid: 'room' }, dependencies);
		expect(dependencies.writer.remove).not.toHaveBeenCalled();
	});

	it('reports removal failures to the caller', async () => {
		const dependencies = setup();
		dependencies.writer.remove.mockRejectedValue(new Error('unavailable'));
		await expect(applyDeleteMessageBulkToSearchIndex({ rid: 'room', ids: ['a'] }, dependencies)).rejects.toThrow('unavailable');
	});
});
