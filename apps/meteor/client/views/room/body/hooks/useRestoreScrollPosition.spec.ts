import { renderHook } from '@testing-library/react';
import React from 'react';

import { useRestoreScrollPosition } from './useRestoreScrollPosition';
import { RoomManager } from '../../../../lib/RoomManager';

jest.mock('../../../../lib/RoomManager', () => ({
	RoomManager: {
		getStore: jest.fn(),
	},
}));

describe('useRestoreScrollPosition', () => {
	it('should restore room scroll position based on store', () => {
		(RoomManager.getStore as jest.Mock).mockReturnValue({ scroll: 100, atBottom: false });

		const mockElement = {
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		};

		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		const { unmount } = renderHook(() => useRestoreScrollPosition('room-id'));

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(mockElement).toHaveProperty('scrollTop', 100);
		expect(mockElement).toHaveProperty('scrollLeft', 30);

		unmount();
		expect(mockElement.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
	});

	it('should not restore scroll position if already at bottom', () => {
		(RoomManager.getStore as jest.Mock).mockReturnValue({ scroll: 100, atBottom: true });

		const mockElement = {
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			scrollHeight: 800,
		};

		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		const { unmount } = renderHook(() => useRestoreScrollPosition('room-id'));

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(mockElement).toHaveProperty('scrollTop', 800);
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

		const { unmount } = renderHook(() => useRestoreScrollPosition('room-id'));

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(update).toHaveBeenCalledWith({ scroll: 500, atBottom: false });

		unmount();
		expect(mockElement.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
	});
});
