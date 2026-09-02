import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CallMemberItem from './CallMemberItem';

const renderMember = (member: Parameters<typeof CallMemberItem>[0]['member']) =>
	render(<CallMemberItem member={member} hasChatAccess={true} onRing={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withTranslations('en', 'core', { Declined: 'Declined', Ringing: 'Ringing', Waiting_for_answer: 'Waiting for answer', Left: 'Left' })
			.build(),
	});

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
