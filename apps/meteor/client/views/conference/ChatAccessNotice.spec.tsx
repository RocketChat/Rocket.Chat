import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatAccessNotice from './ChatAccessNotice';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';

// `withJohnDoe` fixes the logged-in id, so the member without access has to be that same user to test self-exclusion.
const uid = 'john.doe';

const buildAccess = (membersWithoutAccess: string[]): ConferenceChatAccess => ({
	rid: 'room-id',
	name: 'general',
	type: 'c',
	membersWithoutAccess,
	canInvite: true,
	members: membersWithoutAccess.map((_id) => ({ _id, username: `user-${_id}`, name: `User ${_id}` })),
});

const renderNotice = (access: ConferenceChatAccess) =>
	render(<ChatAccessNotice callId='call-id' access={access} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

it('shows the count and a Review button when members are missing chat access', () => {
	renderNotice(buildAccess(['someone-else']));

	expect(screen.getByText('__count__participants_cannot_see_the_chat')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
});

it('renders nothing when no member is missing access', () => {
	const { container } = renderNotice(buildAccess([]));

	expect(container).toBeEmptyDOMElement();
});

it('renders nothing to a member who is themselves missing access, since they cannot share what they cannot read', () => {
	const { container } = renderNotice(buildAccess([uid]));

	expect(container).toBeEmptyDOMElement();
});

it('opens the chat access modal when Review is clicked', async () => {
	renderNotice(buildAccess(['someone-else']));

	await userEvent.click(screen.getByRole('button', { name: 'Review' }));

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
	expect(screen.getByText('Chat_access')).toBeInTheDocument();
});
