import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useLoadSurroundingMessages } from './useLoadSurroundingMessages';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { RoomManager } from '../../../../lib/RoomManager';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';
import { router } from '../../../../providers/RouterProvider';
import { Subscriptions } from '../../../../stores';

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		getSurroundingChannelMessages: jest.fn().mockResolvedValue(undefined),
		getSurroundingMessages: jest.fn().mockResolvedValue(undefined),
		isLoaded: jest.fn().mockReturnValue(false),
		getMore: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('../../../../lib/RoomManager', () => ({
	RoomManager: {
		opened: undefined as string | undefined,
	},
}));

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		openRouteLink: jest.fn(),
	},
}));

jest.mock('../../../../lib/utils/callWithErrorHandling', () => ({
	callWithErrorHandling: jest.fn(),
}));

jest.mock('../../../../providers/RouterProvider', () => ({
	router: {
		getSearchParameters: jest.fn().mockReturnValue({}),
		getRouteParameters: jest.fn().mockReturnValue({}),
	},
}));

jest.mock('../../../../stores', () => ({
	Subscriptions: {
		state: {
			find: jest.fn().mockReturnValue(undefined),
		},
	},
}));

const mockUseSearchParameter = jest.fn<string | undefined, []>().mockReturnValue(undefined);

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useSearchParameter: (..._args: unknown[]) => mockUseSearchParameter(),
}));

const mockedCallWithErrorHandling = jest.mocked(callWithErrorHandling);
const mockedRoomHistoryManager = jest.mocked(RoomHistoryManager);
const mockedRoomCoordinator = jest.mocked(roomCoordinator);
const mockedRouter = jest.mocked(router);
const mockedSubscriptions = jest.mocked(Subscriptions);

afterEach(() => {
	jest.clearAllMocks();
	mockUseSearchParameter.mockReturnValue(undefined);
	(RoomManager as { opened: string | undefined }).opened = undefined;
});

describe('useLoadSurroundingMessages', () => {
	it('should return a jumpToRef', () => {
		const { result } = renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current.jumpToRef).toBeDefined();
	});

	it('should not fetch a message when msg search parameter is absent', () => {
		const endpointSpy = jest.fn();

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/chat.getMessage', endpointSpy).build(),
		});

		expect(endpointSpy).not.toHaveBeenCalled();
	});

	it('should fetch the message and jump to it when msg search parameter is present', async () => {
		mockUseSearchParameter.mockReturnValue('msg-1');

		const message = {
			_id: 'msg-1',
			rid: 'room-1',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Hello',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		(RoomManager as { opened: string | undefined }).opened = 'room-1';

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalled();
		});
	});

	it('should navigate to a different room when the message belongs to a room that is not currently opened', async () => {
		mockUseSearchParameter.mockReturnValue('msg-2');

		const message = {
			_id: 'msg-2',
			rid: 'room-2',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Hello',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		(RoomManager as { opened: string | undefined }).opened = 'room-1';

		mockedCallWithErrorHandling.mockResolvedValue({ _id: 'room-2', t: 'c', name: 'general' } as any);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomCoordinator.openRouteLink).toHaveBeenCalled();
		});

		expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalled();
	});

	it('should use the subscription when navigating to a room the user is subscribed to', async () => {
		mockUseSearchParameter.mockReturnValue('msg-3');

		const message = {
			_id: 'msg-3',
			rid: 'room-3',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Hello',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		(RoomManager as { opened: string | undefined }).opened = 'room-1';

		const subscription = { rid: 'room-3', t: 'c', name: 'general' };
		mockedSubscriptions.state.find.mockReturnValue(subscription as any);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomCoordinator.openRouteLink).toHaveBeenCalledWith('c', subscription, {}, {});
		});
	});

	it('should open a thread when the message is a thread message', async () => {
		mockUseSearchParameter.mockReturnValue('msg-4');

		const message = {
			_id: 'msg-4',
			rid: 'room-4',
			tmid: 'parent-msg',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Thread reply',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		mockedCallWithErrorHandling.mockResolvedValue({ _id: 'room-4', t: 'c', name: 'general' } as any);
		mockedRouter.getRouteParameters.mockReturnValue({} as any);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomCoordinator.openRouteLink).toHaveBeenCalled();
		});

		const callArgs = mockedRoomCoordinator.openRouteLink.mock.calls[0];
		expect(callArgs[3]).toEqual(
			expect.objectContaining({
				routeParamsOverrides: { tab: 'thread', context: 'parent-msg' },
			}),
		);
	});

	it('should skip navigation when already viewing the thread', async () => {
		mockUseSearchParameter.mockReturnValue('msg-5');

		const message = {
			_id: 'msg-5',
			rid: 'room-5',
			tmid: 'parent-msg',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Thread reply',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		mockedRouter.getRouteParameters.mockReturnValue({ tab: 'thread', context: 'parent-msg' } as any);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		// Give enough time for the async flow to resolve
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(mockedRoomCoordinator.openRouteLink).not.toHaveBeenCalled();
		expect(mockedRoomHistoryManager.getSurroundingChannelMessages).not.toHaveBeenCalled();
	});

	it('should load surrounding messages for a message with tcount (thread root)', async () => {
		mockUseSearchParameter.mockReturnValue('msg-6');

		const message = {
			_id: 'msg-6',
			rid: 'room-6',
			tcount: 5,
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Thread root',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		mockedCallWithErrorHandling.mockResolvedValue({ _id: 'room-6', t: 'c', name: 'general' } as any);
		mockedRouter.getRouteParameters.mockReturnValue({} as any);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalled();
		});
	});

	it('should call getMore when room history is not loaded for a thread reply', async () => {
		mockUseSearchParameter.mockReturnValue('msg-7');

		const message = {
			_id: 'msg-7',
			rid: 'room-7',
			tmid: 'parent-msg-7',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Thread reply',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		mockedCallWithErrorHandling.mockResolvedValue({ _id: 'room-7', t: 'c', name: 'general' } as any);
		mockedRouter.getRouteParameters.mockReturnValue({} as any);
		mockedRoomHistoryManager.isLoaded.mockReturnValue(false);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomHistoryManager.getMore).toHaveBeenCalledWith('room-7');
		});
	});

	it('should not call getMore when room history is already loaded for a thread reply', async () => {
		mockUseSearchParameter.mockReturnValue('msg-8');

		const message = {
			_id: 'msg-8',
			rid: 'room-8',
			tmid: 'parent-msg-8',
			ts: new Date('2024-01-01T00:00:00Z').toISOString(),
			u: { _id: 'user-1', username: 'john' },
			msg: 'Thread reply',
			_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
		};

		mockedCallWithErrorHandling.mockResolvedValue({ _id: 'room-8', t: 'c', name: 'general' } as any);
		mockedRouter.getRouteParameters.mockReturnValue({} as any);
		mockedRoomHistoryManager.isLoaded.mockReturnValue(true);

		renderHook(() => useLoadSurroundingMessages(), {
			wrapper: mockAppRoot()
				.withEndpoint(
					'GET',
					'/v1/chat.getMessage',
					() =>
						({
							message,
						}) as any,
				)
				.build(),
		});

		await waitFor(() => {
			expect(mockedRoomCoordinator.openRouteLink).toHaveBeenCalled();
		});

		expect(mockedRoomHistoryManager.getMore).not.toHaveBeenCalled();
	});
});
