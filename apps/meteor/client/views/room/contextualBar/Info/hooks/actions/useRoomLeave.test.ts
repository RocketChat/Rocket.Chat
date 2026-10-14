import { after, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeRoom, createFakeSubscription } from '../../../../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../../../../tests/mocks/moduleScope';

let useRoomLeave: (typeof import('./useRoomLeave'))['useRoomLeave'];

const mockRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1' });
const mockSubscription = createFakeSubscription({ name: 'room1', t: 'c', disableNotifications: false, rid: 'room1' });

describe('useRoomLeave', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../../../../client/lib/LegacyRoomManager', {
			exports: {
				LegacyRoomManager: {
					close: fn<FunctionLike>(),
				},
			},
		});
		mock.module('../../../../../../../client/lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: {
					getRoomDirectives: () => ({
						getUiText: () => 'leaveWarning',
					}),
				},
			},
		});
		({ useRoomLeave } = require('./useRoomLeave'));
	});

	after(leaveModuleScope);

	it('should return leave function if user has subscription', () => {
		const wrapper = mockAppRoot()
			.withPermission('leave-c')
			.withSubscription({ ...mockSubscription, rid: 'room1' })
			.build();

		const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
		expect(typeof result.current).toBe('function');
	});

	it('should return null if user does not have subscription', () => {
		const wrapper = mockAppRoot().withPermission('leave-c').build();

		const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
		expect(result.current).toBeNull();
	});
});
