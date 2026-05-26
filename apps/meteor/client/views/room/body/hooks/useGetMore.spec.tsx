import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

import { useGetMore } from './useGetMore';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		isLoading: jest.fn(),
		isLoadingNext: jest.fn(),
		hasMore: jest.fn(),
		hasMoreNext: jest.fn(),
		getMore: jest.fn(),
		getMoreNext: jest.fn(),
		restoreScroll: jest.fn(),
	},
}));

const mockGetMore = jest.fn();

describe('useGetMore', () => {
	it('should call getMore when scrolling near top and hasMore is true', async () => {
		const root = mockAppRoot();

		const Test = () => {
			const [atBottom] = useState(false);
			const { innerRef } = useGetMore('room-id', atBottom);
			return (
				<div ref={innerRef as any} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};
		(RoomHistoryManager.isLoading as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMore as jest.Mock).mockReturnValue(true);
		(RoomHistoryManager.hasMoreNext as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.getMore as jest.Mock).mockImplementation(mockGetMore);

		render(<Test />, {
			wrapper: root.build(),
		});

		const scrollableElement = screen.getByTestId('scrollable-element');
		Object.defineProperties(scrollableElement, {
			scrollTop: { value: 10, writable: true, configurable: true },
			clientHeight: { value: 100, configurable: true },
			scrollHeight: { value: 800, configurable: true },
		});
		scrollableElement.dispatchEvent(new Event('scroll'));

		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();

		await waitFor(() => {
			expect(RoomHistoryManager.getMore).toHaveBeenCalledWith('room-id');
		});
	});

	it('should call getMoreNext when scrolling near bottom and hasMoreNext is true', async () => {
		const root = mockAppRoot();
		(RoomHistoryManager.isLoading as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMore as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMoreNext as jest.Mock).mockReturnValue(true);
		(RoomHistoryManager.getMoreNext as jest.Mock).mockImplementation(mockGetMore);

		const Test = () => {
			const [atBottom] = useState(false);
			const { innerRef } = useGetMore('room-id', atBottom);
			return (
				<div ref={innerRef as any} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};
		render(<Test />, {
			wrapper: root.build(),
		});
		const scrollableElement = screen.getByTestId('scrollable-element');
		Object.defineProperties(scrollableElement, {
			scrollTop: { value: 700, writable: true, configurable: true },
			clientHeight: { value: 100, configurable: true },
			scrollHeight: { value: 800, configurable: true },
		});
		scrollableElement.dispatchEvent(new Event('scroll'));
		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();

		await waitFor(() => {
			expect(RoomHistoryManager.getMoreNext).toHaveBeenCalledWith('room-id');
		});
	});
});
