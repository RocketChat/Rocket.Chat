import { renderHook } from '@testing-library/react';

import { useIsAtBottomRef } from './useIsAtBottomRef';
import { RoomManager } from '../../../../lib/RoomManager';

jest.mock('../../../../lib/RoomManager', () => ({
	RoomManager: { getStore: jest.fn() },
}));

const mockStore = (store: { atBottom: boolean } | undefined) => (RoomManager.getStore as jest.Mock).mockReturnValue(store);

describe('useIsAtBottomRef', () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
