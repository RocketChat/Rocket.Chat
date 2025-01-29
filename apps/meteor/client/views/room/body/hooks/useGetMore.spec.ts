import { renderHook } from '@testing-library/react';
import React from 'react';

import { useGetMore } from './useGetMore';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		isLoading: jest.fn(),
		hasMore: jest.fn(),
		hasMoreNext: jest.fn(),
		getMore: jest.fn(),
		getMoreNext: jest.fn(),
	},
}));

const mockGetMore = jest.fn();

describe('useGetMore', () => {
	it('should call getMore when scrolling near top and hasMore is true', () => {
		(RoomHistoryManager.isLoading as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMore as jest.Mock).mockReturnValue(true);
		(RoomHistoryManager.hasMoreNext as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.getMore as jest.Mock).mockImplementation(mockGetMore);
		const atBottomRef = { current: false };

		const mockElement = {
			addEventListener: jest.fn((event, handler) => {
				if (event === 'scroll') {
					handler({
						target: {
							scrollTop: 10,
							clientHeight: 300,
						},
					});
				}
			}),
			removeEventListener: jest.fn(),
		};

		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		const { unmount } = renderHook(() => useGetMore('room-id', atBottomRef));

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(RoomHistoryManager.getMore).toHaveBeenCalledWith('room-id');

		unmount();
		expect(mockElement.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
	});

	it('should call getMoreNext when scrolling near bottom and hasMoreNext is true', () => {
		(RoomHistoryManager.isLoading as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMore as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMoreNext as jest.Mock).mockReturnValue(true);
		(RoomHistoryManager.getMoreNext as jest.Mock).mockImplementation(mockGetMore);

		const atBottomRef = { current: false };
		const mockElement = {
			addEventListener: jest.fn((event, handler) => {
				if (event === 'scroll') {
					handler({
						target: {
							scrollTop: 600,
							clientHeight: 300,
							scrollHeight: 800,
						},
					});
				}
			}),
			removeEventListener: jest.fn(),
		};
		const useRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockElement });

		renderHook(() => useGetMore('room-id', atBottomRef));

		expect(useRefSpy).toHaveBeenCalledWith(null);
		expect(RoomHistoryManager.getMoreNext).toHaveBeenCalledWith('room-id', atBottomRef);
	});
});
