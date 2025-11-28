import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import SidebarItemBadges from './SidebarItemBadges';
import { createFakeSubscription } from '../../../tests/mocks/data';

jest.mock('./OmnichannelBadges', () => ({
	__esModule: true,
	default: () => <div data-testid='omnichannel-badges'>OmnichannelBadges</div>,
}));

const createRoomWithSubscription = (overrides: Partial<SubscriptionWithRoom> = {}) => {
	return createFakeSubscription(overrides) as unknown as IRoom & ISubscription;
};

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
		render(
			<SidebarItemBadges room={createRoomWithSubscription({ unread: 1, userMentions: 1, groupMentions: 0 })} roomTitle='Test Room' />,
			{ wrapper: appRoot },
		);

		expect(screen.getByRole('status', { name: '1 mention from Test Room' })).toBeInTheDocument();
	});

	it('should not render UnreadBadge when there are no unread messages', () => {
		render(
			<SidebarItemBadges room={createRoomWithSubscription({ unread: 0, userMentions: 0, groupMentions: 0 })} roomTitle='Test Room' />,
			{ wrapper: appRoot },
		);

		expect(screen.queryByRole('status', { name: 'Test Room' })).not.toBeInTheDocument();
	});

	it('should render OmnichannelBadges when the room is an omnichannel room', () => {
		render(<SidebarItemBadges room={createRoomWithSubscription({ t: 'l' })} />, { wrapper: appRoot });

		expect(screen.getByTestId('omnichannel-badges')).toBeInTheDocument();
	});

	it('should not render OmnichannelBadges when the room is not an omnichannel room', () => {
		render(<SidebarItemBadges room={createRoomWithSubscription({ t: 'p' })} />, { wrapper: appRoot });

		expect(screen.queryByTestId('omnichannel-badges')).not.toBeInTheDocument();
	});
});
