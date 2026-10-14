import { describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import proxyquire from 'proxyquire';
import { useState } from 'react';

const mockGetMore = fn<FunctionLike>();

const RoomHistoryManagerMock = {
	RoomHistoryManager: {
		isLoading: fn<FunctionLike>(),
		isLoadingNext: fn<FunctionLike>(),
		hasMore: fn<FunctionLike>(),
		hasMoreNext: fn<FunctionLike>(),
		getMore: fn<FunctionLike>(),
		getMoreNext: fn<FunctionLike>(),
		restoreScroll: fn<FunctionLike>(),
		on: fn<FunctionLike>(() => () => undefined),
	},
};

const { RoomHistoryManager } = RoomHistoryManagerMock as unknown as typeof import('../../../../lib/RoomHistoryManager');

const scrollingMock = {
	getBoundingClientRect: fn<FunctionLike>(),
};

const { getBoundingClientRect } = scrollingMock as unknown as typeof import('../../../../lib/scrolling');

const { useGetMore } = proxyquire.noCallThru().load<typeof import('./useGetMore')>('./useGetMore', {
	'../../../../lib/RoomHistoryManager': RoomHistoryManagerMock,
	'../../../../lib/scrolling': scrollingMock,
});

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
		(RoomHistoryManager.isLoading as Mock<FunctionLike>).mockReturnValue(false);
		(RoomHistoryManager.hasMore as Mock<FunctionLike>).mockReturnValue(true);
		(RoomHistoryManager.hasMoreNext as Mock<FunctionLike>).mockReturnValue(false);
		(RoomHistoryManager.getMore as Mock<FunctionLike>).mockImplementation(mockGetMore);

		(getBoundingClientRect as Mock<FunctionLike>).mockReturnValue({
			scrollTop: 10,
			clientHeight: 100,
			scrollHeight: 800,
		});

		render(<Test />, {
			wrapper: root.build(),
		});

		const scrollableElement = screen.getByTestId('scrollable-element');
		scrollableElement.scrollTop = 10;
		// Simulate real user input before the scroll — the hook ignores observer / programmatic
		// scroll events until the user has interacted with the list.
		scrollableElement.dispatchEvent(new Event('wheel'));
		scrollableElement.dispatchEvent(new Event('scroll'));

		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();

		await waitFor(() => {
			expect(RoomHistoryManager.getMore).toHaveBeenCalledWith('room-id');
		});
	});

	it('should not call getMore when the container has no size (hidden behind the contextual bar)', async () => {
		const root = mockAppRoot();

		const Test = () => {
			const [atBottom] = useState(false);
			const { innerRef } = useGetMore('room-id', atBottom);
			return (
				<div style={{ display: 'none' }}>
					<div ref={innerRef as any} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
						<div style={{ height: '800px' }}></div>
					</div>
				</div>
			);
		};
		(RoomHistoryManager.isLoading as Mock<FunctionLike>).mockReturnValue(false);
		(RoomHistoryManager.hasMore as Mock<FunctionLike>).mockReturnValue(true);
		(RoomHistoryManager.hasMoreNext as Mock<FunctionLike>).mockReturnValue(false);
		(RoomHistoryManager.getMore as Mock<FunctionLike>).mockClear();

		(getBoundingClientRect as Mock<FunctionLike>).mockReturnValue({
			scrollTop: 0,
			clientHeight: 0,
			scrollHeight: 0,
		});

		render(<Test />, {
			wrapper: root.build(),
		});

		const scrollableElement = screen.getByTestId('scrollable-element');
		scrollableElement.dispatchEvent(new Event('wheel'));
		scrollableElement.dispatchEvent(new Event('scroll'));

		await new Promise((resolve) => setTimeout(resolve, 150));

		expect(RoomHistoryManager.getMore).not.toHaveBeenCalled();
	});

	it('should call getMoreNext when scrolling near bottom and hasMoreNext is true', () => {
		const root = mockAppRoot();
		(RoomHistoryManager.isLoading as Mock<FunctionLike>).mockReturnValue(false);
		(RoomHistoryManager.hasMore as Mock<FunctionLike>).mockReturnValue(false);
		(RoomHistoryManager.hasMoreNext as Mock<FunctionLike>).mockReturnValue(true);
		(RoomHistoryManager.getMoreNext as Mock<FunctionLike>).mockImplementation(mockGetMore);

		const Test = () => {
			const [atBottom] = useState(false);
			const { innerRef } = useGetMore('room-id', atBottom);
			return (
				<div ref={innerRef as any} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};
		(getBoundingClientRect as Mock<FunctionLike>).mockReturnValue({
			scrollTop: 700,
			clientHeight: 100,
			scrollHeight: 800,
		});
		render(<Test />, {
			wrapper: root.build(),
		});
		const scrollableElement = screen.getByTestId('scrollable-element');
		scrollableElement.scrollTop = 700;
		// Simulate real user input before the scroll — the hook ignores observer / programmatic
		// scroll events until the user has interacted with the list.
		scrollableElement.dispatchEvent(new Event('wheel'));
		scrollableElement.dispatchEvent(new Event('scroll'));
		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();
		expect(RoomHistoryManager.getMoreNext).toHaveBeenCalledWith('room-id');
	});
});
