import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessageSearch from './MessageSearch';
import FakeRoomProvider from '../../../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../../../tests/mocks/data';
import type { MessageSearchItem } from '../hooks/useMessageSearchQuery';

jest.mock('../../../../../components/PaginatedVirtualList', () => ({
	PaginatedVirtualList: ({
		items,
		totalCount,
		renderItem,
	}: {
		items: MessageSearchItem[];
		totalCount: number;
		renderItem: (item: MessageSearchItem, index: number) => ReactNode;
	}) => (
		<div data-testid='message-search-list' data-total-count={totalCount}>
			{items.map((item, index) => (
				<div key={item._id}>{renderItem(item, index)}</div>
			))}
		</div>
	),
}));

jest.mock('../../../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
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

// TODO: Create a <FakeMessageListProvider> to mock the MessageListProvider
jest.mock('../../../MessageList/providers/MessageListProvider', () => ({ children }: { children: ReactNode }) => <>{children}</>);

const getUserInfoMocked = jest.fn().mockResolvedValue({ user: createFakeUser({ _id: 'peer-uid', username: 'peer-username' }) });

const appRoot = (overrides: { user?: IUser | null; room?: IRoom; subscription?: SubscriptionWithRoom } = {}) => {
	const {
		user = createFakeUser({ _id: 'own-uid', username: 'own-username' }),
		room = createFakeRoom({ uids: ['own-uid', 'peer-uid'] }),
		subscription = createFakeSubscription(),
	} = overrides;

	const root = mockAppRoot()
		.withRoom(room)
		.withEndpoint('GET', '/v1/users.info', getUserInfoMocked)
		.wrap((children) => (
			<FakeRoomProvider roomOverrides={room} subscriptionOverrides={subscription}>
				{children}
			</FakeRoomProvider>
		));

	if (user !== null) {
		root.withUser(user);
	}

	return root.build();
};

describe('MessageSearch', () => {
	it('renders the empty state when no messages are returned', () => {
		render(<MessageSearch {...defaultProps} />, {
			wrapper: appRoot(),
		});

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

		render(<MessageSearch {...defaultProps} items={[roomMessage, systemMessage]} itemCount={2} />, {
			wrapper: appRoot(),
		});

		expect(screen.getByText('Message message-1')).toBeInTheDocument();
		expect(screen.getByText('User_added_to')).toBeInTheDocument();
		expect(screen.getAllByText('formatted-date')).toHaveLength(2);
	});
});
