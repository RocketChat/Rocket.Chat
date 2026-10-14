import { after, afterEach, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import { createElement, useContext, type ReactNode } from 'react';

import { createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useOpenRoom: (typeof import('./useOpenRoom'))['useOpenRoom'];
let LegacyRoomManager: (typeof import('../../../lib/LegacyRoomManager'))['LegacyRoomManager'];
let RoomNotFoundError: (typeof import('../../../lib/errors/RoomNotFoundError'))['RoomNotFoundError'];
let Rooms: (typeof import('../../../stores'))['Rooms'];
let Subscriptions: (typeof import('../../../stores'))['Subscriptions'];

const EmbeddedLayout = ({ children }: { children: ReactNode }) =>
	createElement(LayoutContext.Provider, { value: { ...useContext(LayoutContext), isEmbedded: true } }, children);

describe('useOpenRoom', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../lib/LegacyRoomManager', {
			exports: {
				LegacyRoomManager: { open: fn<FunctionLike>(), close: fn<FunctionLike>() },
			},
		});
		mock.module('../../../lib/RoomManager', {
			exports: {
				RoomManager: { opened: null },
			},
		});
		mock.module('./useOpenRoomMutation', {
			exports: {
				useOpenRoomMutation: () => ({ mutateAsync: fn<FunctionLike>() }),
			},
		});
		({ useOpenRoom } = require('./useOpenRoom'));
		({ LegacyRoomManager } = require('../../../lib/LegacyRoomManager'));
		({ RoomNotFoundError } = require('../../../lib/errors/RoomNotFoundError'));
		({ Rooms, Subscriptions } = require('../../../stores'));
	});

	after(leaveModuleScope);

	afterEach(() => {
		Subscriptions.state.replaceAll([]);
		Rooms.state.replaceAll([]);
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
		const subscribedWhenOpened = fn<FunctionLike>();
		(LegacyRoomManager.open as Mock<FunctionLike>).mockImplementationOnce(({ rid }) =>
			subscribedWhenOpened(!!Subscriptions.state.find((record) => record.rid === rid)),
		);

		const { result } = renderHook(() => useOpenRoom({ type: 'd', reference: dmRid }), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withMethod('getRoomByTypeAndName', () => createFakeRoom({ _id: dmRid, t: 'd' }) as any)
				.withEndpoint(
					'GET',
					'/v1/subscriptions.getOne',
					() =>
						({
							subscription: { _id: 'sub-id', rid: dmRid, t: 'd', name: 'bob', u: { _id: 'john.doe' }, open: true },
						}) as any,
				)
				.wrap((children) => createElement(EmbeddedLayout, null, children))
				.build(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(subscribedWhenOpened).toHaveBeenCalledWith(true);
	});

	describe('error classification', () => {
		it('maps error-no-permission to RoomNotFoundError without retrying (regression for #40991)', async () => {
			const getRoomByTypeAndName = fn<FunctionLike>().mockImplementation(() => {
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
			const getRoomByTypeAndName = fn<FunctionLike>().mockImplementation(() => {
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

			const getRoomByTypeAndName = fn<FunctionLike>()
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
