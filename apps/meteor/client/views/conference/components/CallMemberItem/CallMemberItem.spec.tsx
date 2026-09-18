import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CallMemberItem from './CallMemberItem';

const renderMember = (member: Parameters<typeof CallMemberItem>[0]['member'], { canRing = false } = {}) => {
	const appRoot = mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', { Declined: 'Declined', Ringing: 'Ringing', Waiting_for_answer: 'Waiting for answer', Left: 'Left' });

	// Ringing anyone is a workspace permission, and most of what this row says has nothing to do with it — so it
	// is off unless the test is about the button.
	if (canRing) {
		appRoot.withPermission('videoconf-ring-users');
	}

	return render(<CallMemberItem member={member} hasChatAccess={true} onRing={jest.fn()} />, { wrapper: appRoot.build() });
};

const base = { _id: 'user2', username: 'user2', name: 'User Two', ts: new Date() };

// The ring window outlives the answer: a decline lands a second or two into a fifteen-second ring, so the
// member is still inside it. What the row must say is what they *did*, not that their phone is still ringing.
it('says a member declined, even while their ring window is still open', () => {
	const now = new Date();
	renderMember({ ...base, joined: false, ringingAt: now, declined: true, declinedAt: now } as any);

	expect(screen.getByText('Declined')).toBeInTheDocument();
	expect(screen.queryByText('Ringing')).not.toBeInTheDocument();
});

it('says a member is ringing while they have not answered', () => {
	renderMember({ ...base, joined: false, ringingAt: new Date() } as any);

	expect(screen.getByText('Ringing')).toBeInTheDocument();
});

// Declined and no longer ringing, so there is something to ring them back for — `canRingConferenceMember` is
// what decides that, and it is deliberately not what the two below are about.
const ringable = { ...base, joined: false, declined: true } as any;

it('offers to ring a member who can be rung', () => {
	renderMember(ringable, { canRing: true });

	expect(screen.getByRole('button', { name: `Ring__name__` })).toBeInTheDocument();
});

// `video-conference.ring` refuses without the permission, so the button could only ever fail. A control that is
// offered and then rejected reads as the call being broken rather than as the workspace saying no.
it('does not offer to ring where the workspace would not let this caller ring', () => {
	renderMember(ringable, { canRing: false });

	expect(screen.queryByRole('button', { name: `Ring__name__` })).not.toBeInTheDocument();
});
