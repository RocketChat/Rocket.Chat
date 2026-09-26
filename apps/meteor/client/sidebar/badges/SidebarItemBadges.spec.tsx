import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import type { SidebarItemBadgesProps } from './SidebarItemBadges';
import SidebarItemBadges from './SidebarItemBadges';
import { createFakeSubscription } from '../../../tests/mocks/data';
import InvitationBadge from '../../components/InvitationBadge';

describe('SidebarItemBadges', () => {
	const appRoot = mockAppRoot()
		.withTranslations('en', 'core', {
			Invited__date__: 'Invited {{date}}',
			mentions_counter_one: '{{count}} mention',
			mentions_counter_other: '{{count}} mentions',
			__unreadTitle__from__roomTitle__: '{{unreadTitle}} from {{roomTitle}}',
		})
		.build();

	const noUnread = { show: false, title: '', label: '', total: 0, variant: 'secondary' } as const;

	// The badges the product owns arrive as slots, so the application wires them exactly as it does in the sidebar.
	const renderBadges = (props: Omit<SidebarItemBadgesProps, 'unread'> & Partial<Pick<SidebarItemBadgesProps, 'unread'>>) =>
		render(
			<SidebarItemBadges
				unread={noUnread}
				renderOmnichannelBadges={() => <i role='status' aria-label='OmnichannelBadges' />}
				renderInvitationBadge={(invitationDate) => <InvitationBadge marginBlockStart={2} invitationDate={invitationDate} />}
				{...props}
			/>,
			{ wrapper: appRoot },
		);

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should render UnreadBadge when there are unread messages', () => {
		renderBadges({
			room: createFakeSubscription({ unread: 1, userMentions: 1, groupMentions: 0 }),
			unread: { show: true, title: '1 mention', label: '1 mention from Test Room', total: 1, variant: 'danger' },
		});

		expect(screen.getByRole('status', { name: '1 mention from Test Room' })).toBeInTheDocument();
	});

	it('should not render UnreadBadge when there are no unread messages', () => {
		renderBadges({ room: createFakeSubscription({ unread: 0, userMentions: 0, groupMentions: 0 }) });

		expect(screen.queryByRole('status', { name: 'Test Room' })).not.toBeInTheDocument();
	});

	it('should render OmnichannelBadges when the room is an omnichannel room', () => {
		renderBadges({ room: createFakeSubscription({ t: 'l' }) });

		expect(screen.getByRole('status', { name: 'OmnichannelBadges' })).toBeInTheDocument();
	});

	it('should not render OmnichannelBadges when the room is not an omnichannel room', () => {
		renderBadges({ room: createFakeSubscription({ t: 'p' }) });

		expect(screen.queryByRole('status', { name: 'OmnichannelBadges' })).not.toBeInTheDocument();
	});

	it('should render InvitationBadge when subscription has status INVITED', () => {
		renderBadges({
			room: createFakeSubscription({
				status: 'INVITED',
				inviter: { name: 'Rocket Cat', username: 'rocket.cat', _id: 'rocket.cat' },
				ts: new Date('2025-01-01T00:00:00.000Z'),
			}),
		});

		expect(screen.getByRole('status', { name: 'Invited January 1st, 2025' })).toBeInTheDocument();
	});

	it('should not render InvitationBadge when subscription does not have status INVITED', () => {
		renderBadges({ room: createFakeSubscription() });

		expect(screen.queryByRole('status', { name: /Invited/ })).not.toBeInTheDocument();
	});

	it('draws nothing for a badge the application did not supply', () => {
		render(<SidebarItemBadges room={createFakeSubscription({ t: 'l' })} unread={noUnread} />, { wrapper: appRoot });

		expect(screen.queryByRole('status', { name: 'OmnichannelBadges' })).not.toBeInTheDocument();
	});
});
