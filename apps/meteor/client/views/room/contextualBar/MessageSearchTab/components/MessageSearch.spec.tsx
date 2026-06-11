import type { IMessage } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';

import MessageSearch from './MessageSearch';

const useMessageSearchQueryMock = jest.fn();

jest.mock('../hooks/useMessageSearchQuery', () => ({
	useMessageSearchQuery: (...args: unknown[]) => useMessageSearchQueryMock(...args),
}));

jest.mock('../../../../../components/PaginatedVirtualList', () => ({
	PaginatedVirtualList: ({ items, renderItem }: { items: IMessage[]; renderItem: (item: IMessage, index: number) => React.ReactNode }) => (
		<div data-testid='message-search-list'>
			{items.map((item, index) => (
				<div key={item._id}>{renderItem(item, index)}</div>
			))}
		</div>
	),
}));

jest.mock('../../../../../components/message/variants/RoomMessage', () => ({ message }: { message: IMessage }) => (
	<div data-testid='room-message'>{message.msg}</div>
));

jest.mock('../../../../../components/message/variants/SystemMessage', () => ({ message }: { message: IMessage }) => (
	<div data-testid='system-message'>{message.msg}</div>
));

jest.mock('../../../../../hooks/useFormatDate', () => ({
	useFormatDate: () => () => 'formatted-date',
}));

jest.mock('../../../MessageList/MessageListErrorBoundary', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../MessageList/providers/MessageListProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../contexts/RoomContext', () => ({
	useRoomSubscription: () => ({
		tunread: ['message-1'],
		tunreadUser: ['message-1'],
		tunreadGroup: ['message-1'],
	}),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useTranslation: () => (key: string) => key,
	useUserPreference: () => true,
}));

const createMessage = (id: string, overrides: Partial<IMessage> = {}): IMessage =>
	({
		_id: id,
		rid: 'room-id',
		msg: `Message ${id}`,
		ts: new Date('2026-03-22T10:00:00.000Z'),
		u: { _id: 'user-id', username: 'testuser', name: 'Test User' },
		_updatedAt: new Date('2026-03-22T10:00:00.000Z'),
		...overrides,
	}) as IMessage;

describe('MessageSearch', () => {
	beforeEach(() => {
		useMessageSearchQueryMock.mockReturnValue({
			isPending: false,
			isSuccess: true,
			data: { items: [], itemCount: 0 },
			fetchNextPage: jest.fn(),
		});
	});

	afterEach(() => {
		useMessageSearchQueryMock.mockReset();
	});

	it('renders the empty state when no messages are returned', () => {
		render(<MessageSearch searchText='hello' globalSearch={false} />);

		expect(screen.getByText('No_results_found')).toBeInTheDocument();
	});

	it('renders nothing until the search query succeeds', () => {
		useMessageSearchQueryMock.mockReturnValue({
			isPending: true,
			isSuccess: false,
			data: undefined,
			fetchNextPage: jest.fn(),
		});

		const { container } = render(<MessageSearch searchText='hello' globalSearch={false} />);

		expect(container).toBeEmptyDOMElement();
	});

	it('renders room and system messages with date dividers', () => {
		const roomMessage = createMessage('message-1');
		const systemMessage = createMessage('message-2', {
			ts: new Date('2026-03-23T10:00:00.000Z'),
			t: 'au',
			msg: 'System event',
		});

		useMessageSearchQueryMock.mockReturnValue({
			isPending: false,
			isSuccess: true,
			data: { items: [roomMessage, systemMessage], itemCount: 2 },
			fetchNextPage: jest.fn(),
		});

		render(<MessageSearch searchText='hello' globalSearch={false} />);

		expect(screen.getByTestId('room-message')).toHaveTextContent('Message message-1');
		expect(screen.getByTestId('system-message')).toHaveTextContent('System event');
		expect(screen.getAllByText('formatted-date')).toHaveLength(2);
	});
});
