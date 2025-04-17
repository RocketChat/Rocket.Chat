import { renderHook } from '@testing-library/react';
import React from 'react';

import { useRestoreScrollPosition } from './useRestoreScrollPosition';
import { RoomManager } from '../../../../lib/RoomManager';

jest.mock('../../../../lib/RoomManager', () => ({
	RoomManager: {
		getStore: jest.fn(),
	},
	useOpenedRoom: jest.fn(() => 'room-id'),
	useSecondLevelOpenedRoom: jest.fn(() => 'room-id'),
}));

describe('useRestoreScrollPosition', () => {
	it('should restore room scroll position based on store', () => {
		(RoomManager.getStore as jest.Mock).mockReturnValue({ scroll: 100, atBottom: false });

		const mockElement = {
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		};

		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		const { unmount } = renderHook(() => useRestoreScrollPosition());

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(mockElement).toHaveProperty('scrollTop', 100);
		expect(mockElement).toHaveProperty('scrollLeft', 30);

		unmount();
		expect(mockElement.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
	});

	it('should do nothing if no previous scroll position is stored', () => {
		(RoomManager.getStore as jest.Mock).mockReturnValue({ atBottom: true });

		const mockElement = {
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			scrollHeight: 800,
			scrollTop: 123,
		};

		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		const { unmount } = renderHook(() => useRestoreScrollPosition());

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(mockElement).toHaveProperty('scrollTop', 123);
		expect(mockElement).not.toHaveProperty('scrollLeft');

		unmount();
		expect(mockElement.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
	});

	it('should update store based on scroll position', () => {
		const update = jest.fn();
		(RoomManager.getStore as jest.Mock).mockReturnValue({ update });

		const mockElement = {
			addEventListener: jest.fn((event, handler) => {
				if (event === 'scroll') {
					handler({
						target: {
							scrollTop: 500,
						},
					});
				}
			}),
			removeEventListener: jest.fn(),
		};

		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		const { unmount } = renderHook(() => useRestoreScrollPosition());

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(update).toHaveBeenCalledWith({ scroll: 500, atBottom: false });

		unmount();
		expect(mockElement.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
	});
});
