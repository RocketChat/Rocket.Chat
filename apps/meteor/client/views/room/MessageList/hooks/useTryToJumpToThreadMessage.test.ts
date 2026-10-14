import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike, Mocked } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let useTryToJumpToThreadMessage: (typeof import('./useTryToJumpToThreadMessage'))['default'];
let RoomManager: (typeof import('../../../../lib/RoomManager'))['RoomManager'];
let useGoToRoom: (typeof import('../../hooks/useGoToRoom'))['useGoToRoom'];
let mockedUseGoToRoom: Mocked<typeof useGoToRoom>;

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const mockedGoToRoom = fn<FunctionLike>().mockResolvedValue(undefined);

describe('useTryToJumpToThreadMessage', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../hooks/useGoToRoom', {
			exports: {
				useGoToRoom: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../lib/RoomManager', {
			exports: {
				RoomManager: {
					opened: undefined as string | undefined,
				},
			},
		});
		mock.module('../../../../lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: {
					openRouteLink: fn<FunctionLike>(),
				},
			},
		});
		mock.module('../../../../providers/RouterProvider', {
			exports: {
				router: {
					getSearchParameters: fn<FunctionLike>().mockReturnValue({}),
					getRouteParameters: fn<FunctionLike>().mockReturnValue({}),
				},
			},
		});
		mock.module('../../../../stores', {
			exports: {
				Subscriptions: {
					state: {
						find: fn<FunctionLike>().mockReturnValue(undefined),
					},
				},
			},
		});
		({ default: useTryToJumpToThreadMessage } = require('./useTryToJumpToThreadMessage'));
		({ RoomManager } = require('../../../../lib/RoomManager'));
		({ useGoToRoom } = require('../../hooks/useGoToRoom'));
		mockedUseGoToRoom = mocked(useGoToRoom);
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mockedUseGoToRoom.mockReturnValue(mockedGoToRoom);
	});

	afterEach(() => {
		mocker.clearAllMocks();
		(RoomManager as { opened: string | undefined }).opened = undefined;
	});
	describe('early return when msg param is absent or jumpContext is jumpToUnread', () => {
		it('should not navigate when msg search parameter is absent', () => {
			const endpointSpy = fn<FunctionLike>();

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot().withEndpoint('GET', '/v1/chat.getMessage', endpointSpy).build(),
			});

			expect(endpointSpy).not.toHaveBeenCalled();
			expect(mockedGoToRoom).not.toHaveBeenCalled();
		});

		it('should not navigate when jumpContext is jumpToUnread', async () => {
			const threadMessage = {
				_id: 'msg-1',
				rid: 'room-1',
				tmid: 'parent-msg-1',
				ts: new Date('2024-01-01T00:00:00Z').toISOString(),
				u: { _id: 'user-1', username: 'john' },
				msg: 'Thread reply',
				_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
			};

			const endpointSpy = fn<FunctionLike>().mockResolvedValue({ message: threadMessage });

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot()
					.withRouter({ getSearchParameters: () => ({ msg: 'msg-1', jumpContext: 'jumpToUnread' }) })
					.withEndpoint('GET', '/v1/chat.getMessage', endpointSpy)
					.withMethod(
						'getRoomById',
						() =>
							({
								_id: 'room-1',
								t: 'c',
								name: 'general',
							}) as any,
					)
					.build(),
			});

			await waitFor(() => {
				expect(endpointSpy).toHaveBeenCalledWith({ msgId: 'msg-1' });
			});

			await waitFor(async () => {
				await new Promise((resolve) => setTimeout(resolve, 300));
				expect(mockedGoToRoom).not.toHaveBeenCalled();
			});
		});
	});

	describe('when jumpContext is absent', () => {
		it('should open the thread when jumpContext is null', async () => {
			const threadMessage = {
				_id: 'msg-1',
				rid: 'room-1',
				tmid: 'parent-msg-1',
				ts: new Date('2024-01-01T00:00:00Z').toISOString(),
				u: { _id: 'user-1', username: 'john' },
				msg: 'Thread reply',
				_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
			};

			const endpointSpy = fn<FunctionLike>().mockResolvedValue({ message: threadMessage });

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot()
					.withRouter({ getSearchParameters: () => ({ msg: 'msg-1' }) })
					.withEndpoint('GET', '/v1/chat.getMessage', endpointSpy)
					.withMethod(
						'getRoomById',
						() =>
							({
								_id: 'room-1',
								t: 'c',
								name: 'general',
							}) as any,
					)
					.build(),
			});

			await waitFor(() => {
				expect(endpointSpy).toHaveBeenCalledWith({ msgId: 'msg-1' });
			});

			await waitFor(() => {
				expect(mockedGoToRoom).toHaveBeenCalledWith('room-1', {
					routeParamsOverrides: { tab: 'thread', context: 'parent-msg-1' },
					replace: false,
				});
			});
		});
	});
});
