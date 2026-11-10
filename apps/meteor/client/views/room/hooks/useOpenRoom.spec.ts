import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { LayoutContext, useStream } from '@rocket.chat/ui-contexts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, useContext, type ReactNode } from 'react';

import { useOpenRoom } from './useOpenRoom';
import { createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';
import { LegacyRoomManager } from '../../../lib/LegacyRoomManager';
import { RoomNotFoundError } from '../../../lib/errors/RoomNotFoundError';
import { Rooms, Subscriptions } from '../../../stores';

jest.mock('../../../lib/LegacyRoomManager', () => ({
	LegacyRoomManager: { open: jest.fn(), close: jest.fn() },
}));

jest.mock('../../../lib/RoomManager', () => ({
	RoomManager: { opened: null },
}));

jest.mock('./useOpenRoomMutation', () => ({
	useOpenRoomMutation: () => ({ mutateAsync: jest.fn() }),
}));

const EmbeddedLayout = ({ children }: { children: ReactNode }) =>
	createElement(LayoutContext.Provider, { value: { ...useContext(LayoutContext), isEmbedded: true } }, children);

afterEach(() => {
	Subscriptions.state.replaceAll([]);
	Rooms.state.replaceAll([]);
});

describe('useOpenRoom', () => {
	it('updates an open public preview when a team is converted to a channel', async () => {
		const rid = 'preview-room-id';
		const name = 'preview-team';
		const channel = { ...createFakeRoom({ _id: rid, t: 'c', name }), t: 'c' as const, name };
		const teamRoom = { ...channel, teamId: 'team-id', teamMain: true };
		const streamRef: StreamControllerRef<'room-data'> = {};
		let converted = false;

		const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: name }), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withPermission('preview-c-room')
				.withStream('room-data', streamRef)
				.withMethod('getRoomByTypeAndName', () => (converted ? channel : teamRoom) as any)
				.build(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(Rooms.state.get(rid)).toMatchObject({ teamId: 'team-id', teamMain: true });

		converted = true;
		act(() => streamRef.controller?.emit(rid, [{ _id: rid }]));

		await waitFor(() => {
			const room = Rooms.state.get(rid);
			expect(room).toMatchObject({ _id: rid, name });
			expect(room).not.toHaveProperty('teamId');
			expect(room).not.toHaveProperty('teamMain');
		});
	});
	it('refreshes a public preview after the stream becomes ready', async () => {
		const rid = 'preview-ready-room';
		const name = 'preview-ready';
		const channel = { ...createFakeRoom({ _id: rid, t: 'c', name }), t: 'c' as const, name };
		const teamRoom = { ...channel, teamId: 'team-id', teamMain: true };
		const streamRef: StreamControllerRef<'room-data'> = {};
		let converted = false;
		const getRoomByTypeAndName = jest.fn(() => (converted ? channel : teamRoom) as any);

		const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: name }), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withPermission('preview-c-room')
				.withStream('room-data', streamRef)
				.withMethod('getRoomByTypeAndName', getRoomByTypeAndName)
				.build(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(Rooms.state.get(rid)).toMatchObject({ teamId: 'team-id', teamMain: true });

		const { controller } = streamRef;
		if (!controller) {
			throw new Error('Expected room-data stream controller');
		}
		expect(controller.has(rid)).toBe(true);
		expect(getRoomByTypeAndName).toHaveBeenCalledTimes(1);

		// Conversion happens before server acknowledgement; no stream event arrives.
		converted = true;

		await act(async () => {
			controller.ready(rid);
		});

		await waitFor(() => {
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(2);
			const room = Rooms.state.get(rid);
			expect(room).toMatchObject({ _id: rid, name });
			expect(room).not.toHaveProperty('teamId');
			expect(room).not.toHaveProperty('teamMain');
		});
	});
	it('groups preview updates and cancels pending refreshes on unmount', async () => {
		const rid = 'preview-burst-room';
		const name = 'preview-burst';
		const room = createFakeRoom({ _id: rid, t: 'c', name });
		const getRoomByTypeAndName = jest.fn(() => room as any);
		const streamRef: StreamControllerRef<'room-data'> = {};

		const { result, unmount } = renderHook(() => useOpenRoom({ type: 'c', reference: name }), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withPermission('preview-c-room')
				.withStream('room-data', streamRef)
				.withMethod('getRoomByTypeAndName', getRoomByTypeAndName)
				.build(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		const { controller } = streamRef;
		if (!controller) {
			throw new Error('Expected room-data stream controller');
		}
		getRoomByTypeAndName.mockClear();

		jest.useFakeTimers();
		try {
			await act(async () => {
				controller.emit(rid, [{ _id: rid }]);
			});
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(1);

			await act(async () => {
				for (let i = 0; i < 10; i++) {
					controller.emit(rid, [{ _id: rid }]);
				}
			});
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(1);

			await act(async () => {
				await jest.advanceTimersByTimeAsync(1000);
			});
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(2);
			await act(async () => {
				controller.emit(rid, [{ _id: rid }]);
			});
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(3);

			await act(async () => {
				controller.emit(rid, [{ _id: rid }]);
			});
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(3);

			unmount();

			await act(async () => {
				await jest.advanceTimersByTimeAsync(1000);
			});
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(3);
		} finally {
			unmount();
			jest.useRealTimers();
		}
	});
	describe('type-aware subscription cache lookup', () => {
		it('resolves /channel/<name> to the channel even when a DM with the same name is cached', async () => {
			const channelRid = 'channel-rid-abc';
			const dmRid = 'dm-rid-abc';
			const sharedName = 'alex';

			// Seed cache: only a DM subscription named 'alex' — no channel subscription
			Subscriptions.state.store(createFakeSubscription({ t: 'd', name: sharedName, rid: dmRid, open: true }));
			Rooms.state.store(createFakeRoom({ _id: dmRid, t: 'd' }));

			const channelRoom = createFakeRoom({ _id: channelRid, t: 'c', name: sharedName });

			const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: sharedName }), {
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withPermission('preview-c-room')
					.withMethod('getRoomByTypeAndName', () => channelRoom as any)
					.build(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data?.rid).toBe(channelRid);
		});

		it('resolves from cache when a channel subscription with a matching name and type is already cached', async () => {
			const channelRid = 'channel-rid-general';
			const channelName = 'general';

			Subscriptions.state.store(createFakeSubscription({ t: 'c', name: channelName, rid: channelRid, open: true }));
			Rooms.state.store(createFakeRoom({ _id: channelRid, t: 'c', name: channelName }));

			const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: channelName }), {
				wrapper: mockAppRoot().withJohnDoe().build(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data?.rid).toBe(channelRid);
		});

		it('resolves a DM from cache when navigating by rid', async () => {
			const dmRid = 'dm-rid-xyz';

			Subscriptions.state.store(createFakeSubscription({ t: 'd', name: 'bob', rid: dmRid, open: true }));
			Rooms.state.store(createFakeRoom({ _id: dmRid, t: 'd' }));

			const { result } = renderHook(() => useOpenRoom({ type: 'd', reference: dmRid }), {
				wrapper: mockAppRoot().withJohnDoe().build(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data?.rid).toBe(dmRid);
		});
	});

	it('stores a missing subscription before opening the room', async () => {
		const dmRid = 'dm-rid-embedded';
		const subscribedWhenOpened = jest.fn();
		(LegacyRoomManager.open as jest.Mock).mockImplementationOnce(({ rid }) =>
			subscribedWhenOpened(!!Subscriptions.state.find((record) => record.rid === rid)),
		);

		const { result } = renderHook(() => useOpenRoom({ type: 'd', reference: dmRid }), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withMethod('getRoomByTypeAndName', () => createFakeRoom({ _id: dmRid, t: 'd' }) as any)
				.withEndpoint(
					'GET',
					'/v1/subscriptions.getOne',
					() => ({ subscription: { _id: 'sub-id', rid: dmRid, t: 'd', name: 'bob', u: { _id: 'john.doe' }, open: true } }) as any,
				)
				.wrap((children) => createElement(EmbeddedLayout, null, children))
				.build(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(subscribedWhenOpened).toHaveBeenCalledWith(true);
	});

	describe('error classification', () => {
		it('maps error-no-permission to RoomNotFoundError without retrying (regression for #40991)', async () => {
			const getRoomByTypeAndName = jest.fn().mockImplementation(() => {
				throw Object.assign(new Error('No permission'), { error: 'error-no-permission' });
			});

			const { result } = renderHook(() => useOpenRoom({ type: 'p', reference: 'private-channel' }), {
				wrapper: mockAppRoot().withJohnDoe().withMethod('getRoomByTypeAndName', getRoomByTypeAndName).build(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));
			expect(result.current.error).toBeInstanceOf(RoomNotFoundError);
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(1);
		});

		it('maps error-invalid-room to RoomNotFoundError without retrying for non-DM rooms', async () => {
			const getRoomByTypeAndName = jest.fn().mockImplementation(() => {
				throw Object.assign(new Error('Invalid room'), { error: 'error-invalid-room' });
			});

			const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: 'missing-channel' }), {
				wrapper: mockAppRoot().withJohnDoe().withMethod('getRoomByTypeAndName', getRoomByTypeAndName).build(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));
			expect(result.current.error).toBeInstanceOf(RoomNotFoundError);
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(1);
		});

		it('retries unclassified transient errors and recovers on a later attempt', async () => {
			const channelRid = 'channel-rid-transient';
			const channelName = 'flaky-channel';
			const channelRoom = createFakeRoom({ _id: channelRid, t: 'c', name: channelName });

			const getRoomByTypeAndName = jest
				.fn()
				.mockImplementationOnce(() => {
					throw new Error('network down');
				})
				.mockImplementation(() => channelRoom);

			const { result } = renderHook(() => useOpenRoom({ type: 'c', reference: channelName }), {
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withPermission('preview-c-room')
					.withMethod('getRoomByTypeAndName', getRoomByTypeAndName)
					.build(),
			});

			// Backoff is Math.min(1000 * 2 ** attempt, 5000); first retry fires after ~1s.
			await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 3000 });
			expect(result.current.data?.rid).toBe(channelRid);
			expect(getRoomByTypeAndName).toHaveBeenCalledTimes(2);
		});
	});
});
it('retains stream readiness until the last subscriber leaves', async () => {
	const rid = 'shared-preview-room';
	const streamRef: StreamControllerRef<'room-data'> = {};
	const { result, unmount } = renderHook(() => useStream('room-data'), {
		wrapper: mockAppRoot().withStream('room-data', streamRef).build(),
	});

	const { controller } = streamRef;
	if (!controller) {
		throw new Error('Expected room-data stream controller');
	}

	const firstReady = jest.fn();
	const stopFirst = result.current(rid, jest.fn(), { onReady: firstReady });

	await act(async () => {
		controller.ready(rid);
	});
	expect(firstReady).toHaveBeenCalledTimes(1);

	const secondReady = jest.fn();
	const stopSecond = result.current(rid, jest.fn(), { onReady: secondReady });

	expect(secondReady).not.toHaveBeenCalled();
	await act(async () => {
		await Promise.resolve();
	});
	expect(secondReady).toHaveBeenCalledTimes(1);
	expect(firstReady).toHaveBeenCalledTimes(1);

	stopFirst();
	expect(controller.has(rid)).toBe(true);
	stopSecond();
	expect(controller.has(rid)).toBe(false);

	const thirdReady = jest.fn();
	const stopThird = result.current(rid, jest.fn(), { onReady: thirdReady });

	await act(async () => {
		await Promise.resolve();
	});
	expect(thirdReady).not.toHaveBeenCalled();

	await act(async () => {
		controller.ready(rid);
	});
	expect(thirdReady).toHaveBeenCalledTimes(1);

	stopThird();
	unmount();
});
