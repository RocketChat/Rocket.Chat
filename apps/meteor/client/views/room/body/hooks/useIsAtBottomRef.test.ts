import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let useIsAtBottomRef: (typeof import('./useIsAtBottomRef'))['useIsAtBottomRef'];
let RoomManager: (typeof import('../../../../lib/RoomManager'))['RoomManager'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockStore = (store: { atBottom: boolean } | undefined) => (RoomManager.getStore as Mock<FunctionLike>).mockReturnValue(store);

describe('useIsAtBottomRef', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../lib/RoomManager', {
			exports: {
				RoomManager: { getStore: fn<FunctionLike>() },
			},
		});
		({ useIsAtBottomRef } = require('./useIsAtBottomRef'));
		({ RoomManager } = require('../../../../lib/RoomManager'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	it('starts at the bottom when the room has no stored position yet', () => {
		mockStore(undefined);

		const { result } = renderHook(() => useIsAtBottomRef('rid'));

		expect(result.current.current).toBe(true);
	});

	it('starts away from the bottom when the room was left scrolled mid-history', () => {
		mockStore({ atBottom: false });

		const { result } = renderHook(() => useIsAtBottomRef('rid'));

		expect(result.current.current).toBe(false);
	});

	it('starts at the bottom when the room was left at the bottom', () => {
		mockStore({ atBottom: true });

		const { result } = renderHook(() => useIsAtBottomRef('rid'));

		expect(result.current.current).toBe(true);
	});
});
