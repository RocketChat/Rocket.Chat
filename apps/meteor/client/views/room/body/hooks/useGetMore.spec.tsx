import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { useGetMore } from './useGetMore';
import { getBoundingClientRect } from '../../../../../app/ui/client/views/app/lib/scrolling';
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

jest.mock('../../../../../app/ui/client/views/app/lib/scrolling', () => ({
	getBoundingClientRect: jest.fn(),
}));

const mockGetMore = jest.fn();

describe('useGetMore', () => {
	it('should call getMore when scrolling near top and hasMore is true', async () => {
		const root = mockAppRoot();

		const Test = () => {
			const atBottomRef = React.useRef(false);
			const { innerRef } = useGetMore('room-id', atBottomRef);
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

		(getBoundingClientRect as jest.Mock).mockReturnValue({
			scrollTop: 10,
			clientHeight: 100,
			scrollHeight: 800,
		});

		render(<Test />, {
			wrapper: root.build(),
		});

		const scrollableElement = screen.getByTestId('scrollable-element');
		scrollableElement.scrollTop = 10;
		scrollableElement.dispatchEvent(new Event('scroll'));

		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();

		await waitFor(() => {
			expect(RoomHistoryManager.getMore).toHaveBeenCalledWith('room-id');
		});
	});

	it('should call getMoreNext when scrolling near bottom and hasMoreNext is true', () => {
		const root = mockAppRoot();
		(RoomHistoryManager.isLoading as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMore as jest.Mock).mockReturnValue(false);
		(RoomHistoryManager.hasMoreNext as jest.Mock).mockReturnValue(true);
		(RoomHistoryManager.getMoreNext as jest.Mock).mockImplementation(mockGetMore);

		const Test = () => {
			const atBottomRef = React.useRef(false);
			const { innerRef } = useGetMore('room-id', atBottomRef);
			return (
				<div ref={innerRef as any} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};
		(getBoundingClientRect as jest.Mock).mockReturnValue({
			scrollTop: 700,
			clientHeight: 100,
			scrollHeight: 800,
		});
		render(<Test />, {
			wrapper: root.build(),
		});
		const scrollableElement = screen.getByTestId('scrollable-element');
		scrollableElement.scrollTop = 700;
		scrollableElement.dispatchEvent(new Event('scroll'));
		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();
		expect(RoomHistoryManager.getMoreNext).toHaveBeenCalledWith('room-id', expect.anything());
	});
});
