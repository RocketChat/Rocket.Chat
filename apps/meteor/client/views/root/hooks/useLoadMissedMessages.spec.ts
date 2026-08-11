import type { IMessage } from '@rocket.chat/core-typings';
import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { renderHook, waitFor } from '@testing-library/react';

import { useLoadMissedMessages } from './useLoadMissedMessages';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { Messages } from '../../../stores/Messages';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useConnectionStatus: jest.fn(),
}));

jest.mock('../../../../app/ui-utils/client/lib/LegacyRoomManager', () => ({
	LegacyRoomManager: { openedRooms: { 'room-id': { rid: 'room-id' } } },
}));

jest.mock('../../../../app/ui-utils/client/lib/RoomHistoryManager', () => ({
	upsertMessageBulk: jest.fn(),
}));

jest.mock('../../../../app/utils/client/lib/SDKClient', () => ({
	sdk: { rest: { get: jest.fn() } },
}));

const rid = 'room-id';

const createMessage = (_id: string, ts: Date, extra: Partial<IMessage> = {}): IMessage =>
	({
		_id,
		rid,
		msg: _id,
		ts,
		_updatedAt: ts,
		u: { _id: 'user-id', username: 'user' },
		...extra,
	}) as IMessage;

const mockSyncResponse = ({ updated = [], deleted = [] }: { updated?: unknown[]; deleted?: { _id: string }[] } = {}) => {
	(sdk.rest.get as jest.Mock).mockResolvedValue({ result: { updated, deleted } });
};

/** Renders the hook while offline, then flips the connection back on — the only transition that triggers a sync. */
const renderReconnection = () => {
	(useConnectionStatus as jest.Mock).mockReturnValue({ connected: false });
	const { rerender } = renderHook(() => useLoadMissedMessages());

	(useConnectionStatus as jest.Mock).mockReturnValue({ connected: true });
	rerender();
};

beforeEach(() => {
	jest.clearAllMocks();
	Messages.state.replaceAll([]);
	mockSyncResponse();
});

describe('useLoadMissedMessages', () => {
	it('should bound the sync window by the oldest and newest loaded messages', async () => {
		const oldest = new Date(1_000);
		const newest = new Date(3_000);
		Messages.state.storeMany([createMessage('oldest', oldest), createMessage('newest', newest)]);

		renderReconnection();

		await waitFor(() =>
			expect(sdk.rest.get).toHaveBeenCalledWith('/v1/chat.syncMessages', {
				roomId: rid,
				lastUpdate: newest.toISOString(),
				fromTs: oldest.toISOString(),
			}),
		);
	});

	it('should not sync while the connection stays online', async () => {
		Messages.state.store(createMessage('message', new Date(1_000)));

		(useConnectionStatus as jest.Mock).mockReturnValue({ connected: true });
		const { rerender } = renderHook(() => useLoadMissedMessages());
		rerender();

		await waitFor(() => expect(sdk.rest.get).not.toHaveBeenCalled());
	});

	it('should remove the messages reported as deleted', async () => {
		Messages.state.storeMany([createMessage('kept', new Date(1_000)), createMessage('dropped', new Date(2_000))]);
		mockSyncResponse({ deleted: [{ _id: 'dropped' }] });

		renderReconnection();

		await waitFor(() => expect(Messages.state.get('dropped')).toBeUndefined());
		expect(Messages.state.get('kept')).toBeDefined();
	});

	it('should clear "tmid" from replies whose thread parent was deleted', async () => {
		Messages.state.storeMany([createMessage('parent', new Date(1_000)), createMessage('reply', new Date(2_000), { tmid: 'parent' })]);
		mockSyncResponse({ deleted: [{ _id: 'parent' }] });

		renderReconnection();

		await waitFor(() => expect(Messages.state.get('parent')).toBeUndefined());
		expect(Messages.state.get('reply')).toBeDefined();
		expect(Messages.state.get('reply')).not.toHaveProperty('tmid');
	});

	it('should keep "tmid" on replies whose thread parent survived', async () => {
		Messages.state.storeMany([
			createMessage('parent', new Date(1_000)),
			createMessage('reply', new Date(2_000), { tmid: 'parent' }),
			createMessage('dropped', new Date(3_000)),
		]);
		mockSyncResponse({ deleted: [{ _id: 'dropped' }] });

		renderReconnection();

		await waitFor(() => expect(Messages.state.get('dropped')).toBeUndefined());
		expect(Messages.state.get('reply')).toHaveProperty('tmid', 'parent');
	});
});
