import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import CallMemberItem from './CallMemberItem';
import { ConferenceContext } from '../../context/ConferenceContext';
import { buildConferenceContext } from '../../fixtures/storyFixtures';

// Declined, so there is something to ring them back for — `canRingConferenceMember` is what decides that, and it
// is deliberately not what this is about.
const declined = { _id: 'grace-id', username: 'grace', name: 'Grace Hopper', joined: false, declined: true };

const renderRow = ({ canRing }: { canRing: boolean }) => {
	const AppRoot = mockAppRoot().withJohnDoe().build();
	const conference = buildConferenceContext({ viewer: { canRingUsers: canRing } });

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>
		</AppRoot>
	);

	return render(<CallMemberItem member={declined} hasChatAccess onRing={jest.fn()} />, { wrapper });
};

it('offers to ring a member who can be rung', () => {
	renderRow({ canRing: true });

	expect(screen.getByRole('button', { name: `Ring__name__` })).toBeInTheDocument();
});

// `video-conference.ring` refuses without the permission, so the button could only ever fail. A control that is
// offered and then rejected reads as the call being broken rather than as the workspace saying no.
it('does not offer to ring where the workspace would not let this caller ring', () => {
	renderRow({ canRing: false });

	expect(screen.queryByRole('button', { name: `Ring__name__` })).not.toBeInTheDocument();
});
