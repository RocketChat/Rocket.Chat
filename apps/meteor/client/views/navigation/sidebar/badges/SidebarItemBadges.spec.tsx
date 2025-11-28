import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import SidebarItemBadges from './SidebarItemBadges';
import { createFakeSubscription } from '../../../../../tests/mocks/data';

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

	it('shound render UnreadBadge when there are unread messages', () => {
		render(<SidebarItemBadges room={createFakeSubscription({ unread: 1, userMentions: 1, groupMentions: 0 })} roomTitle='Test Room' />, {
			wrapper: appRoot,
		});

		expect(screen.getByRole('status', { name: '1 mention from Test Room' })).toBeInTheDocument();
	});

	it('shound not render UnreadBadge when there are no unread messages', () => {
		render(<SidebarItemBadges room={createFakeSubscription({ unread: 0, userMentions: 0, groupMentions: 0 })} roomTitle='Test Room' />, {
			wrapper: appRoot,
		});

		expect(screen.queryByRole('status', { name: 'Test Room' })).not.toBeInTheDocument();
	});
});
