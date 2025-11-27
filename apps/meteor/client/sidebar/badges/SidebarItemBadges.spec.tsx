import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import SidebarItemBadges from './SidebarItemBadges';
import { createFakeSubscription } from '../../../tests/mocks/data';

jest.mock('../../views/omnichannel/components/OmnichannelBadges', () => ({
	__esModule: true,
	default: () => <i role='status' aria-label='OmnichannelBadges' />,
}));

describe('SidebarItemBadges', () => {
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
		render(<SidebarItemBadges room={createFakeSubscription({ unread: 1, userMentions: 1, groupMentions: 0 })} roomTitle='Test Room' />, {
			wrapper: appRoot,
		});

		expect(screen.getByRole('status', { name: '1 mention from Test Room' })).toBeInTheDocument();
	});

	it('should not render UnreadBadge when there are no unread messages', () => {
		render(<SidebarItemBadges room={createFakeSubscription({ unread: 0, userMentions: 0, groupMentions: 0 })} roomTitle='Test Room' />, {
			wrapper: appRoot,
		});

		expect(screen.queryByRole('status', { name: 'Test Room' })).not.toBeInTheDocument();
	});

	it('should render OmnichannelBadges when the room is an omnichannel room', () => {
		render(<SidebarItemBadges room={createFakeSubscription({ t: 'l' })} />, { wrapper: appRoot });

		expect(screen.getByRole('status', { name: 'OmnichannelBadges' })).toBeInTheDocument();
	});

	it('should not render OmnichannelBadges when the room is not an omnichannel room', () => {
		render(<SidebarItemBadges room={createFakeSubscription({ t: 'p' })} />, { wrapper: appRoot });

		expect(screen.queryByRole('status', { name: 'OmnichannelBadges' })).not.toBeInTheDocument();
	});

	it('should render InvitationBadge when subscription has status INVITED', () => {
		render(<SidebarItemBadges room={createRoomWithSubscription({ status: 'INVITED' })} />, { wrapper: appRoot });

		expect(screen.getByRole('status', { name: 'Message request' })).toBeInTheDocument();
	});

	it('should not render InvitationBadge when subscription does not have status INVITED', () => {
		render(<SidebarItemBadges room={createRoomWithSubscription()} />, { wrapper: appRoot });

		expect(screen.queryByRole('status', { name: 'Message request' })).not.toBeInTheDocument();
	});
});
