import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import RoomListItemTitleIcon from './RoomListItemTitleIcon';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', { Notifications_off: 'Notifications off', Draft: 'Draft', Thread_draft: 'Thread draft' })
	.build();

const room = (overrides: Partial<SubscriptionWithRoom> = {}) => ({ rid: 'r', t: 'c', ...overrides }) as SubscriptionWithRoom;

it('shows nothing for a room with notifications on and no draft', () => {
	const { container } = render(<RoomListItemTitleIcon room={room()} />, { wrapper: appRoot });

	expect(container).toBeEmptyDOMElement();
});

it('marks a room whose notifications are off, as an image a screen reader names', async () => {
	const { container } = render(<RoomListItemTitleIcon room={room({ disableNotifications: true })} />, { wrapper: appRoot });

	expect(screen.getByRole('img', { name: 'Notifications off' })).toBeInTheDocument();
	expect(screen.queryByRole('img', { name: 'Draft' })).not.toBeInTheDocument();
	expect(await axe(container)).toHaveNoViolations();
});

it('marks a draft, after the mute mark when both apply', () => {
	render(<RoomListItemTitleIcon room={room({ disableNotifications: true, draft: 'hello' })} />, { wrapper: appRoot });

	expect(screen.getAllByRole('img').map((element) => element.getAttribute('aria-label'))).toEqual(['Notifications off', 'Draft']);
});
