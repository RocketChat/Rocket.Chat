import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import RoomListItemTitleIcon from './RoomListItemTitleIcon';

const appRoot = mockAppRoot().withTranslations('en', 'core', { Muted: 'Muted', Draft: 'Draft', Thread_draft: 'Thread draft' }).build();

const room = (overrides: Partial<SubscriptionWithRoom> = {}) => ({ rid: 'r', t: 'c', ...overrides }) as SubscriptionWithRoom;

it('shows nothing for a room with notifications on and no draft', () => {
	const { container } = render(<RoomListItemTitleIcon room={room()} />, { wrapper: appRoot });

	expect(container).toBeEmptyDOMElement();
});

it('marks a room whose notifications are off', () => {
	render(<RoomListItemTitleIcon room={room({ disableNotifications: true })} />, { wrapper: appRoot });

	expect(screen.getByTitle('Muted')).toBeInTheDocument();
	expect(screen.queryByTitle('Draft')).not.toBeInTheDocument();
});

it('marks a draft, after the mute mark when both apply', () => {
	const { container } = render(<RoomListItemTitleIcon room={room({ disableNotifications: true, draft: 'hello' })} />, { wrapper: appRoot });

	const titles = [...container.querySelectorAll('[title]')].map((element) => element.getAttribute('title'));
	expect(titles).toEqual(['Muted', 'Draft']);
});
