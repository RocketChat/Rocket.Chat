import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RoomSidePanelItemBadges from './RoomSidePanelItemBadges';
import { createFakeSubscription } from '../../../../../tests/mocks/data';

jest.mock('../omnichannel/SidePanelOmnichannelBadges', () => ({
	__esModule: true,
	default: () => <i role='status' aria-label='OmnichannelBadges' />,
}));

describe('RoomSidePanelItemBadges', () => {
	const appRoot = mockAppRoot()
		.withTranslations('en', 'core', {
			Message_request: 'Message request',
			mentions_counter_one: '{{count}} mention',
			mentions_counter_other: '{{count}} mentions',
			__unreadTitle__from__roomTitle__: '{{unreadTitle}} from {{roomTitle}}',
		})
		.build();

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should render UnreadBadge when there are unread messages', () => {
		render(
			<RoomSidePanelItemBadges room={createFakeSubscription({ unread: 1, userMentions: 1, groupMentions: 0 })} roomTitle='Test Room' />,
			{ wrapper: appRoot },
		);

		expect(screen.getByRole('status', { name: '1 mention from Test Room' })).toBeInTheDocument();
	});

	it('should not render UnreadBadge when there are no unread messages', () => {
		render(
			<RoomSidePanelItemBadges room={createFakeSubscription({ unread: 0, userMentions: 0, groupMentions: 0 })} roomTitle='Test Room' />,
			{ wrapper: appRoot },
		);

		expect(screen.queryByRole('status', { name: 'Test Room' })).not.toBeInTheDocument();
	});

	it('should render OmnichannelBadges when the room is an omnichannel room', () => {
		render(<RoomSidePanelItemBadges room={createFakeSubscription({ t: 'l' })} />, { wrapper: appRoot });

		expect(screen.getByRole('status', { name: 'OmnichannelBadges' })).toBeInTheDocument();
	});

	it('should not render OmnichannelBadges when the room is not an omnichannel room', () => {
		render(<RoomSidePanelItemBadges room={createFakeSubscription({ t: 'p' })} />, { wrapper: appRoot });

		expect(screen.queryByRole('status', { name: 'OmnichannelBadges' })).not.toBeInTheDocument();
	});
});
