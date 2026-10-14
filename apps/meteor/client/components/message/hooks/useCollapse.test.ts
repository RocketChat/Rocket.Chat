import { after, afterEach, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';
import { expect } from 'expect';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useCollapse: (typeof import('./useCollapse'))['useCollapse'];
let RoomManager: (typeof import('../../../lib/RoomManager'))['RoomManager'];

const closeOpenedRoom = () => {
	const currentlyOpened = RoomManager.opened;
	if (currentlyOpened) {
		RoomManager.back(currentlyOpened);
	}
};

describe('useCollapse', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../client/lib/RoomHistoryManager', {
			exports: {
				RoomHistoryManager: {},
			},
		});
		({ useCollapse } = require('./useCollapse'));
		({ RoomManager } = require('../../../lib/RoomManager'));
	});

	after(leaveModuleScope);

	afterEach(closeOpenedRoom);

	it('should toggle with local state when keyed but no room is opened', () => {
		const { result } = renderHook(() => useCollapse(true, 'mid-0'), { wrapper: mockAppRoot().build() });
		expect(result.current[0]).toBe(true);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(false);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(true);
	});

	it('should persist the toggle in the opened room store when keyed', () => {
		RoomManager.open('room-a');
		const { result, unmount } = renderHook(() => useCollapse(false, 'mid-a'), { wrapper: mockAppRoot().build() });
		expect(result.current[0]).toBe(false);

		act(() => result.current[1]());
		expect(result.current[0]).toBe(true);
		unmount();

		const { result: remounted } = renderHook(() => useCollapse(false, 'mid-a'), { wrapper: mockAppRoot().build() });
		expect(remounted.current[0]).toBe(true);
	});

	it('should toggle with local state when there is no key', () => {
		RoomManager.open('room-b');
		const { result } = renderHook(() => useCollapse(false), { wrapper: mockAppRoot().build() });

		act(() => result.current[1]());
		expect(result.current[0]).toBe(true);
	});
});
