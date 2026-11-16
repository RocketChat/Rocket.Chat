import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import MessageSearchTab from './MessageSearchTab';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';
import { Rooms } from '../../../../stores';
import { selectedMessageStore } from '../../providers/SelectedMessageStore';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
const mockRoom = createFakeRoom({ _id: 'room', t: 'c' });
const mockSubscription = createFakeSubscription({ rid: 'room', tunread: ['found'], tunreadUser: [], tunreadGroup: [] });
jest.mock('react-virtuoso', () => ({
	Virtuoso: ({ data, itemContent }: { data: unknown[]; itemContent: (index: number, item: unknown) => ReactNode }) => (
		<>{data.map((item, index) => itemContent(index, item))}</>
	),
}));
jest.mock('../../contexts/RoomContext', () => ({
	useRoomSubscription: () => mockSubscription,
	useRoom: () => mockRoom,
}));
jest.mock('./hooks/useMessageSearchProviderQuery', () => ({
	useMessageSearchProviderQuery: () => ({ isSuccess: true, isError: false, data: { key: 'provider' } }),
}));
const mockResults: IMessage[] = [];
jest.mock('./hooks/useMessageSearchQuery', () => ({
	useMessageSearchQuery: () => ({ isSuccess: true, isPending: false, data: mockResults }),
}));
const MockSearchForm = ({ onSearch }: { onSearch: (search: { searchText: string; globalSearch: boolean }) => void }) => {
	useEffect(() => onSearch({ searchText: 'needle', globalSearch: false }), [onSearch]);
	return null;
};
jest.mock('./components/MessageSearchForm', () => ({
	__esModule: true,
	default: (props: React.ComponentProps<typeof MockSearchForm>) => <MockSearchForm {...props} />,
}));

const found = createFakeMessage({
	_id: 'found',
	rid: 'room',
	msg: 'a needle in a haystack',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'a needle in a haystack' }] }],
});
const system = createFakeMessage({ _id: 'joined', rid: 'room', t: 'uj', msg: 'bob' });

beforeEach(() => {
	mockResults.splice(0, mockResults.length, found, system);
});

afterEach(() => act(() => selectedMessageStore.reset()));

const renderSearch = () =>
	render(<MessageSearchTab />, { wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build() });

it('draws the results with the search place and highlights the search text (message-variants R43)', () => {
	renderSearch();

	const row = screen.getByRole('listitem', { name: /needle/ });
	expect(row).toHaveAttribute('aria-roledescription', 'message');
	expect(row).toHaveAttribute('data-sequential', 'false');
	expect(screen.getByText('needle').tagName).toBe('MARK');
	expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('aria-roledescription'))).toContain('system_message');
});

it("gives the results the room's selection and the markers of the subscription (message-variants R25, R43)", () => {
	renderSearch();
	expect(screen.getByRole('listitem', { name: /needle/ })).toHaveAttribute('data-unread', 'true');

	act(() => selectedMessageStore.setIsSelecting(true));

	expect(screen.getAllByRole('checkbox')).toHaveLength(2);
});

describe('the toolbar of a message', () => {
	beforeAll(() => {
		window.DISABLE_ANIMATION = true;
		global.IntersectionObserver = class {
			observe = jest.fn();

			disconnect = jest.fn();
		} as never;
	});

	beforeEach(() => Rooms.state.store(createFakeRoom({ _id: 'room', t: 'c' })));

	afterEach(() => Rooms.state.replaceAll([]));

	it('offers the jump to the message and nothing else inline, in the search place (message-variants R42, R43)', async () => {
		renderSearch();

		const row = screen.getByRole('listitem', { name: /needle/ });
		act(() => row.focus());

		const toolbar = await within(row).findByRole('toolbar', { name: 'Message_actions' });
		expect(
			within(toolbar)
				.getAllByRole('button')
				.map((button) => button.getAttribute('aria-label') ?? button.getAttribute('title')),
		).toEqual(['Jump_to_message']);
	});
});
