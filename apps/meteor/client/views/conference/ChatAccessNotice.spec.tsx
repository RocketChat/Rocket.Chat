import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatAccessNotice from './ChatAccessNotice';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { buildChatAccess } from './testFixtures';

// `withJohnDoe` fixes the logged-in id, so the member without access has to be that same user to test self-exclusion.
const uid = 'john.doe';

const buildAccess = (membersWithoutAccess: string[], joined = true) => buildChatAccess({ membersWithoutAccess, joined });

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

// Someone merely invited may never turn up. Telling everyone else about a person who isn't there is noise, and
// it would have them resolving a situation that hasn't happened.
it('says nothing about a member who was invited but has not joined', () => {
	const { container } = renderNotice(buildAccess(['someone-else'], false));

	expect(container).toBeEmptyDOMElement();
});

it('counts only the members who are actually in the call', () => {
	const access = buildAccess(['present', 'absent']);
	access.members = access.members.map((member) => (member._id === 'absent' ? { ...member, joined: false } : member));

	renderNotice(access);

	expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
});
