import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { UseQueryResult } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessageListTab from './MessageListTab';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';
import { Rooms } from '../../../stores';
import { selectedMessageStore } from '../providers/SelectedMessageStore';

jest.mock('../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
const mockRoom = createFakeRoom({ _id: 'room', t: 'c' });
jest.mock('react-virtuoso', () => ({
	Virtuoso: ({ data, itemContent }: { data: unknown[]; itemContent: (index: number, item: unknown) => ReactNode }) => (
		<>{data.map((item, index) => itemContent(index, item))}</>
	),
}));
const mockSubscription = createFakeSubscription({ rid: 'room', tunread: ['pinned'], tunreadUser: ['pinned'], tunreadGroup: [] });
jest.mock('../contexts/RoomContext', () => ({ useRoomSubscription: () => mockSubscription, useRoom: () => mockRoom }));

const pinned = createFakeMessage({
	_id: 'pinned',
	rid: 'room',
	msg: 'a pinned message',
	tcount: 2,
	tlm: new Date(),
	replies: ['bob'],
} as Partial<IMessage>);
const system = createFakeMessage({ _id: 'joined', rid: 'room', t: 'uj', msg: 'bob' });

const renderTab = (context: 'pinned' | 'starred' | 'mentions' = 'pinned') =>
	render(
		<MessageListTab
			iconName='pin'
			title='Pinned'
			emptyResultMessage='Nothing'
			context={context}
			queryResult={{ isLoading: false, isSuccess: true, data: [pinned, system] } as UseQueryResult<IMessage[]>}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build() },
	);

afterEach(() => act(() => selectedMessageStore.reset()));

it('draws each message with its variant, never sequential, with the markers of the subscription (message-variants R42)', () => {
	renderTab();

	const row = screen.getByRole('listitem', { name: /a pinned message/ });
	expect(row).toHaveAttribute('aria-roledescription', 'message');
	expect(row).toHaveAttribute('data-sequential', 'false');
	expect(row).toHaveAttribute('data-unread', 'true');
	expect(screen.getByTitle('Mentions_you')).toBeInTheDocument();
	expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('aria-roledescription'))).toContain('system_message');
});

it("gives the messages the room's selection and reads whether avatars show from the display settings (message-variants R25, R46)", () => {
	renderTab();
	expect(screen.getAllByRole('figure').length).toBeGreaterThan(0);
	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

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

	it('offers the jump to the message and the menu of the pinned place (message-variants R42, R43)', async () => {
		renderTab();

		const row = screen.getByRole('listitem', { name: /a pinned message/ });
		act(() => row.focus());

		const toolbar = await within(row).findByRole('toolbar', { name: 'Message_actions' });
		expect(
			within(toolbar)
				.getAllByRole('button')
				.map((button) => button.getAttribute('aria-label') ?? button.getAttribute('title')),
		).toEqual(['Jump_to_message', 'More']);
	});
});
