import { after, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeSubscription } from '../../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let useRoomMenuActions: (typeof import('./useRoomMenuActions'))['useRoomMenuActions'];

const mockSubscription = createFakeSubscription({ name: 'room1', fname: 'Room 1', t: 'c', disableNotifications: false, rid: 'room1' });

const mockHookProps = {
	rid: 'room1',
	type: 'c',
	name: 'Room 1',
	isUnread: true,
	cl: true,
	roomOpen: true,
	hideDefaultOptions: false,
	href: '/channel/room1',
} as const;

describe('useRoomMenuActions', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../../client/lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: {
					getRoomDirectives: () => ({
						getUiText: () => 'leaveWarning',
					}),
				},
			},
		});
		mock.module('../../../../../client/lib/LegacyRoomManager', {
			exports: {
				LegacyRoomManager: {
					close: fn<FunctionLike>(),
				},
			},
		});
		mock.module('../../../omnichannel/hooks/useOmnichannelPrioritiesMenu', {
			exports: {
				useOmnichannelPrioritiesMenu: fn<FunctionLike>(() => [
					{ id: 'priority', content: 'Priority', icon: 'priority', onClick: fn<FunctionLike>() },
				]),
			},
		});
		({ useRoomMenuActions } = require('./useRoomMenuActions'));
	});

	after(leaveModuleScope);
	it('should return all menu options for normal rooms', () => {
		const { result } = renderHook(() => useRoomMenuActions(mockHookProps), {
			wrapper: mockAppRoot()
				.withSubscription({ ...mockSubscription, rid: 'room1' })
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		const actions = result.current;
		expect(actions).toHaveLength(2);
		expect(actions[0].items).toHaveLength(4);
		expect(actions[1].title).toBe('Notifications');
		expect(actions[1].items).toHaveLength(2);
	});

	it('should return priorities section for omnichannel room', () => {
		const { result } = renderHook(() => useRoomMenuActions({ ...mockHookProps, type: 'l' }), {
			wrapper: mockAppRoot()
				.withSubscription({ ...mockSubscription, t: 'l' })
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		expect(result.current.length).toBe(2);
		expect(result.current[1].title).toBe('Priorities');
		expect(result.current.some((section) => section.title === 'Notifications')).toBe(false);
		expect(result.current[0].items).toHaveLength(2);
		expect(result.current[0].title).toBe('');
	});

	it('should not return any menu option if hideDefaultOptions', () => {
		const { result } = renderHook(() => useRoomMenuActions({ ...mockHookProps, hideDefaultOptions: true }), {
			wrapper: mockAppRoot()
				.withSubscription(mockSubscription)
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		expect(result.current).toHaveLength(0);
	});

	it('should not return favorite room option if setting is disabled', () => {
		const { result } = renderHook(() => useRoomMenuActions(mockHookProps), {
			wrapper: mockAppRoot()
				.withSubscription(mockSubscription)
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', false)
				.build(),
		});

		const actions = result.current;
		expect(actions).toHaveLength(2);
		expect(actions[0].items).toHaveLength(3);
		expect(actions[0].items.some((item) => item.id === 'toggleFavorite')).toBe(false);
		expect(actions[1].title).toBe('Notifications');
		expect(actions[1].items).toHaveLength(2);
	});
});
