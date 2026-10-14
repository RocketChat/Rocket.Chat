import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage } from '@rocket.chat/core-typings';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useConnectionStatus: (typeof import('@rocket.chat/ui-contexts'))['useConnectionStatus'];
let useLoadMissedMessages: (typeof import('./useLoadMissedMessages'))['useLoadMissedMessages'];
let upsertMessageBulk: (typeof import('../../../lib/RoomHistoryManager'))['upsertMessageBulk'];
let sdk: (typeof import('../../../lib/SDKClient'))['sdk'];
let Messages: (typeof import('../../../stores/Messages'))['Messages'];
let Subscriptions: (typeof import('../../../stores/Subscriptions'))['Subscriptions'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const rid = 'room-id';

const createMessage = (_id: string, ts: Date, extra: Partial<IMessage & { temp: boolean }> = {}): IMessage =>
	({
		_id,
		rid,
		msg: _id,
		ts,
		_updatedAt: ts,
		u: { _id: 'user-id', username: 'user' },
		...extra,
	}) as IMessage;

/** Mimics what the API returns: the same shape as `createMessage`, but with dates serialized. */
const createSerializedMessage = (_id: string, ts: Date, extra: Record<string, unknown> = {}) => ({
	_id,
	rid,
	msg: _id,
	ts: ts.toISOString(),
	_updatedAt: ts.toISOString(),
	u: { _id: 'user-id', username: 'user' },
	...extra,
});

const mockSyncResponse = ({ updated = [], deleted = [] }: { updated?: unknown[]; deleted?: { _id: string }[] } = {}) => {
	(sdk.rest.get as Mock<FunctionLike>).mockResolvedValue({ result: { updated, deleted } });
};

/** Renders the hook while offline, then flips the connection back on — the only transition that triggers a sync. */
const renderReconnection = () => {
	(useConnectionStatus as Mock<FunctionLike>).mockReturnValue({ connected: false });
	const { rerender } = renderHook(() => useLoadMissedMessages());

	(useConnectionStatus as Mock<FunctionLike>).mockReturnValue({ connected: true });
	rerender();
};

describe('useLoadMissedMessages', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				useConnectionStatus: fn<FunctionLike>(),
			},
		});
		mock.module('../../../lib/LegacyRoomManager', {
			exports: {
				LegacyRoomManager: { openedRooms: { 'room-id': { rid: 'room-id' } } },
			},
		});
		mock.module('../../../lib/RoomHistoryManager', {
			exports: {
				upsertMessageBulk: fn<FunctionLike>(),
			},
		});
		mock.module('../../../lib/SDKClient', {
			exports: {
				sdk: { rest: { get: fn<FunctionLike>() } },
			},
		});
		({ useConnectionStatus } = require('@rocket.chat/ui-contexts'));
		({ useLoadMissedMessages } = require('./useLoadMissedMessages'));
		({ upsertMessageBulk } = require('../../../lib/RoomHistoryManager'));
		({ sdk } = require('../../../lib/SDKClient'));
		({ Messages } = require('../../../stores/Messages'));
		({ Subscriptions } = require('../../../stores/Subscriptions'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mocker.clearAllMocks();
		Messages.state.replaceAll([]);
		Subscriptions.state.replaceAll([]);
		mockSyncResponse();
		// stand-in for the real bulk upsert, which only stores the messages it is handed
		(upsertMessageBulk as Mock<FunctionLike>).mockImplementation(async ({ msgs }: { msgs: IMessage[] }) => Messages.state.storeMany(msgs));
	});
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

	it('should leave hidden and temp messages out of the sync window', async () => {
		const oldest = new Date(2_000);
		const newest = new Date(3_000);
		Messages.state.storeMany([
			createMessage('hidden', new Date(1_000), { _hidden: true }),
			createMessage('oldest', oldest),
			createMessage('newest', newest),
			createMessage('temp', new Date(4_000), { temp: true }),
		]);

		renderReconnection();

		await waitFor(() =>
			expect(sdk.rest.get).toHaveBeenCalledWith('/v1/chat.syncMessages', {
				roomId: rid,
				lastUpdate: newest.toISOString(),
				fromTs: oldest.toISOString(),
			}),
		);
	});

	it('should leave messages from other rooms out of the sync window', async () => {
		const oldest = new Date(2_000);
		const newest = new Date(3_000);
		Messages.state.storeMany([
			createMessage('other-older', new Date(1_000), { rid: 'other-room-id' }),
			createMessage('oldest', oldest),
			createMessage('newest', newest),
			createMessage('other-newer', new Date(4_000), { rid: 'other-room-id' }),
		]);

		renderReconnection();

		await waitFor(() =>
			expect(sdk.rest.get).toHaveBeenCalledWith('/v1/chat.syncMessages', {
				roomId: rid,
				lastUpdate: newest.toISOString(),
				fromTs: oldest.toISOString(),
			}),
		);
	});

	it('should not sync a room holding only hidden and temp messages', async () => {
		Messages.state.storeMany([
			createMessage('hidden', new Date(1_000), { _hidden: true }),
			createMessage('temp', new Date(2_000), { temp: true }),
		]);

		renderReconnection();

		await waitFor(() => expect(sdk.rest.get).not.toHaveBeenCalled());
	});

	it('should not sync while the connection stays online', async () => {
		Messages.state.store(createMessage('message', new Date(1_000)));

		(useConnectionStatus as Mock<FunctionLike>).mockReturnValue({ connected: true });
		const { rerender } = renderHook(() => useLoadMissedMessages());
		rerender();

		await waitFor(() => expect(sdk.rest.get).not.toHaveBeenCalled());
	});

	it('should merge the messages reported as updated into the store', async () => {
		const ts = new Date(1_000);
		const editedAt = new Date(2_000);
		Messages.state.storeMany([createMessage('edited', ts), createMessage('untouched', ts)]);
		mockSyncResponse({
			updated: [
				createSerializedMessage('edited', ts, { msg: 'edited text', editedAt: editedAt.toISOString() }),
				createSerializedMessage('added', editedAt),
			],
		});

		renderReconnection();

		await waitFor(() => expect(Messages.state.get('edited')).toHaveProperty('msg', 'edited text'));
		expect(Messages.state.get('edited')).toHaveProperty('editedAt', editedAt);
		expect(Messages.state.get('added')).toHaveProperty('ts', editedAt);
		expect(Messages.state.get('untouched')).toHaveProperty('msg', 'untouched');
	});

	it('should deserialize the dates of the messages reported as updated', async () => {
		const ts = new Date(1_000);
		const editedAt = new Date(2_000);
		Messages.state.store(createMessage('edited', ts));
		mockSyncResponse({ updated: [createSerializedMessage('edited', ts, { editedAt: editedAt.toISOString() })] });

		renderReconnection();

		await waitFor(() => expect(upsertMessageBulk).toHaveBeenCalled());
		expect(upsertMessageBulk).toHaveBeenCalledWith(
			expect.objectContaining({
				msgs: [expect.objectContaining({ _id: 'edited', ts, _updatedAt: ts, editedAt })],
			}),
		);
	});

	it('should pass the room subscription along with the updated messages', async () => {
		const ts = new Date(1_000);
		const subscription = { _id: 'subscription-id', rid } as Parameters<typeof Subscriptions.state.store>[0];
		Messages.state.store(createMessage('edited', ts));
		Subscriptions.state.storeMany([subscription, { _id: 'other-subscription-id', rid: 'other-room-id' } as typeof subscription]);
		mockSyncResponse({ updated: [createSerializedMessage('edited', ts)] });

		renderReconnection();

		await waitFor(() => expect(upsertMessageBulk).toHaveBeenCalledWith(expect.objectContaining({ subscription })));
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
