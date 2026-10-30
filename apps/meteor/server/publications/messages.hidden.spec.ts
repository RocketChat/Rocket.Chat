import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { handleCursorPagination, handleWithoutPagination } from './messages';

jest.mock('@rocket.chat/core-services', () => ({ ClientSafeError: Error }));
jest.mock('@rocket.chat/models', () => ({
	Messages: {
		findForUpdates: jest.fn(),
		findDeletedByRoomIdAfter: jest.fn(),
		findDeletedByRoomIdAndDeletedAt: jest.fn(),
	},
}));
jest.mock('../lib/authorization/canAccessRoom', () => ({}));
jest.mock('../meteor-methods/messages/getChannelHistory', () => ({}));

const hidden = {
	_id: 'deleted-while-offline',
	rid: 'room-a',
	ts: new Date('2026-10-28T00:00:00.000Z'),
	_updatedAt: new Date('2026-10-29T00:00:00.000Z'),
	u: { _id: 'user-a', username: 'alice' },
	_hidden: true,
	t: 'e2e',
	msg: 'ciphertext-canary',
	content: { ciphertext: 'hidden-canary' },
	attachments: [{ title: 'hidden-file-canary' }],
} as unknown as IMessage;

const tombstone = {
	_id: hidden._id,
	rid: hidden.rid,
	ts: hidden.ts,
	_updatedAt: hidden._updatedAt,
	_hidden: true,
	u: hidden.u,
	t: 'rm',
	msg: '',
};

describe('hidden message deletion synchronization', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(Messages.findForUpdates).mockReturnValue({ toArray: async () => [hidden] } as never);
		jest.mocked(Messages.findDeletedByRoomIdAfter).mockReturnValue({ toArray: async () => [] } as never);
		jest.mocked(Messages.findDeletedByRoomIdAndDeletedAt).mockReturnValue({ toArray: async () => [] } as never);
	});

	it('returns a sanitized deletion placeholder after an offline hidden-only delete', async () => {
		const lastUpdate = new Date('2026-10-28T12:00:00.000Z');
		const result = await handleWithoutPagination(hidden.rid, lastUpdate);
		expect(result).toEqual({ updated: [tombstone], deleted: [] });
		expect(JSON.stringify(result)).not.toContain('canary');
		expect(jest.mocked(Messages.findForUpdates)).toHaveBeenCalledWith(
			hidden.rid,
			{ updatedAt: { $gt: lastUpdate }, minTs: undefined },
			{ sort: { ts: -1 } },
		);
	});

	it('uses the update timestamp of the placeholder as the page cursor', async () => {
		const result = await handleCursorPagination('UPDATED', hidden.rid, 2, '0');
		expect(result.updated).toEqual([tombstone]);
		expect(result.cursor).toEqual({ next: null, previous: String(hidden._updatedAt.getTime()) });
	});

	it('preserves visible messages without a placeholder conversion', async () => {
		const visible = { ...hidden, _hidden: false };
		jest.mocked(Messages.findForUpdates).mockReturnValue({ toArray: async () => [visible] } as never);
		const result = await handleWithoutPagination(hidden.rid, new Date(0));
		expect(result.updated).toEqual([visible]);
	});

	it('keeps the send-time depth boundary for hidden deletions', async () => {
		const fromTs = new Date('2026-10-27T00:00:00.000Z');
		await handleWithoutPagination(hidden.rid, new Date(0), fromTs);
		expect(jest.mocked(Messages.findForUpdates)).toHaveBeenCalledWith(
			hidden.rid,
			{ updatedAt: { $gt: new Date(0) }, minTs: fromTs },
			{ sort: { ts: -1 } },
		);
	});
});
