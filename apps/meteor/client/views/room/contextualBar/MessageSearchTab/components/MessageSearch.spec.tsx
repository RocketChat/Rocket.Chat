import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';

import MessageSearch from './MessageSearch';
import type { MessageSearchItem } from '../hooks/useMessageSearchQuery';

jest.mock('../../../../../components/PaginatedVirtualList', () => ({
	PaginatedVirtualList: ({
		items,
		totalCount,
		renderItem,
	}: {
		items: MessageSearchItem[];
		totalCount: number;
		renderItem: (item: MessageSearchItem, index: number) => React.ReactNode;
	}) => (
		<div data-testid='message-search-list' data-total-count={totalCount}>
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

jest.mock('../../../MessageList/MessageListErrorBoundary', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../MessageList/providers/MessageListProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useTranslation: () => (key: string) => key,
}));

const createMessage = (id: string, overrides: Partial<IMessage> = {}): MessageSearchItem =>
	({
		_id: id,
		rid: 'room-id',
		user: 'testuser',
		msg: `Message ${id}`,
		ts: new Date('2026-03-22T10:00:00.000Z'),
		u: { _id: 'user-id', username: 'testuser', name: 'Test User' },
		_updatedAt: new Date('2026-03-22T10:00:00.000Z'),
		...overrides,
	}) as MessageSearchItem;

const subscription = {
	tunread: ['message-1'],
	tunreadUser: ['message-1'],
	tunreadGroup: ['message-1'],
} as ISubscription;

const defaultProps = {
	items: [],
	itemCount: 0,
	isPending: false,
	isSuccess: true,
	fetchNextPage: jest.fn(),
	subscription,
	showUserAvatar: true,
	formatDate: () => 'formatted-date',
	searchText: 'hello',
	noResultsTitle: 'No_results_found',
};

describe('MessageSearch', () => {
	it('renders the empty state when no messages are returned', () => {
		render(<MessageSearch {...defaultProps} />);

		expect(screen.getByText('No_results_found')).toBeInTheDocument();
	});

	it('renders nothing until the search query succeeds', () => {
		const { container } = render(<MessageSearch {...defaultProps} isPending isSuccess={false} />);

		expect(container).toBeEmptyDOMElement();
	});

	it('renders room and system messages with date dividers', () => {
		const roomMessage = createMessage('message-1');
		const systemMessage = createMessage('message-2', {
			ts: new Date('2026-03-23T10:00:00.000Z'),
			t: 'au',
			msg: 'System event',
		});

		render(<MessageSearch {...defaultProps} items={[roomMessage, systemMessage]} itemCount={2} />);

		expect(screen.getByTestId('room-message')).toHaveTextContent('Message message-1');
		expect(screen.getByTestId('system-message')).toHaveTextContent('System event');
		expect(screen.getAllByText('formatted-date')).toHaveLength(2);
	});
});
