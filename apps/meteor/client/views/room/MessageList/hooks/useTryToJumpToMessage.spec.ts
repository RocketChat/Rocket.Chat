import { renderHook, waitFor } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import type { VirtualizerHandle } from 'virtua';

import useTryToJumpToMessage from './useTryToJumpToMessage';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';

const mockUseSearchParameter = jest.fn();
const mockUseEndpoint = jest.fn();

jest.mock(
	'@rocket.chat/ui-contexts',
	() => ({
		useEndpoint: (...args: unknown[]) => mockUseEndpoint(...args),
		useSearchParameter: (...args: unknown[]) => mockUseSearchParameter(...args),
	}),
	{ virtual: true },
);

jest.mock(
	'@rocket.chat/core-typings',
	() => ({
		isThreadMainMessage: jest.fn(() => false),
		isThreadMessage: jest.fn(() => false),
	}),
	{ virtual: true },
);

jest.mock('@tanstack/react-query', () => ({
	useQuery: jest.fn(() => ({ data: undefined })),
}));

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		getSurroundingChannelMessages: jest.fn(),
		isLoading: jest.fn(),
	},
}));

jest.mock('../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({
	setMessageJumpQueryStringParameter: jest.fn(),
}));

jest.mock('../providers/messageHighlightSubscription', () => ({
	clearHighlightMessage: jest.fn(),
	setHighlightMessage: jest.fn(),
}));

describe('useTryToJumpToMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockUseSearchParameter.mockReturnValue('message-2');
		mockUseEndpoint.mockReturnValue(jest.fn());
		jest.mocked(RoomHistoryManager.isLoading).mockReturnValue(false);
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it('scrolls to the message list item after the leading item offset', async () => {
		const scrollToIndex = jest.fn();
		const virtualizerRef = {
			current: {
				scrollToIndex,
			} as unknown as VirtualizerHandle,
		} as MutableRefObject<VirtualizerHandle | null>;

		renderHook(() =>
			useTryToJumpToMessage({
				rid: 'room-id',
				virtualizerRef,
				setIsJumpingToMessage: jest.fn(),
				messages: [{ _id: 'message-1' }, { _id: 'message-2' }],
				messageListItemOffset: 1,
			}),
		);

		await waitFor(() => {
			expect(scrollToIndex).toHaveBeenCalledWith(2, { align: 'center' });
		});
	});
});
