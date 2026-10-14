import { after, before, describe, it, mock } from 'node:test';

import { act, renderHook } from '@testing-library/react';
import { expect } from 'expect';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useIsCollapsibleToggled: (typeof import('./useIsCollapsibleToggled'))['useIsCollapsibleToggled'];
let RoomManager: (typeof import('../../../lib/RoomManager'))['RoomManager'];
describe('useIsCollapsibleToggled', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../client/lib/RoomHistoryManager', {
			exports: {
				RoomHistoryManager: {},
			},
		});
		({ useIsCollapsibleToggled } = require('./useIsCollapsibleToggled'));
		({ RoomManager } = require('../../../lib/RoomManager'));
	});

	after(leaveModuleScope);

	it('should not be toggled by default', () => {
		RoomManager.open('room-a');
		const { result } = renderHook(() => useIsCollapsibleToggled('key-a'));
		expect(result.current).toBe(false);
	});

	it('should reflect an already-toggled key in the opened room store', () => {
		RoomManager.open('room-b');
		RoomManager.getStore('room-b')?.toggleCollapsible('key-b');

		const { result } = renderHook(() => useIsCollapsibleToggled('key-b'));
		expect(result.current).toBe(true);
	});

	it('should re-render when the store toggles after mount', () => {
		RoomManager.open('room-c');
		const { result } = renderHook(() => useIsCollapsibleToggled('key-c'));
		expect(result.current).toBe(false);

		act(() => {
			RoomManager.getStore('room-c')?.toggleCollapsible('key-c');
		});
		expect(result.current).toBe(true);
	});

	it('should not leak a toggle to a different key in the same room', () => {
		RoomManager.open('room-d');
		RoomManager.getStore('room-d')?.toggleCollapsible('key-d1');

		const { result } = renderHook(() => useIsCollapsibleToggled('key-d2'));
		expect(result.current).toBe(false);
	});

	it('should be a no-op when there is no key', () => {
		RoomManager.open('room-e');
		const { result } = renderHook(() => useIsCollapsibleToggled(undefined));
		expect(result.current).toBe(false);
	});

	it('should be a no-op when there is no opened room', () => {
		const currentlyOpened = RoomManager.opened;
		if (currentlyOpened) {
			RoomManager.back(currentlyOpened);
		}

		const { result } = renderHook(() => useIsCollapsibleToggled('key-f'));
		expect(result.current).toBe(false);
	});
});
