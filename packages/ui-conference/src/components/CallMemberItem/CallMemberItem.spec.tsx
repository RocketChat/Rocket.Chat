import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import CallMemberItem from './CallMemberItem';
import { ConferenceContext } from '../../context/ConferenceContext';
import type { ConferenceMember } from '../../context/definitions';
import { buildConferenceContext } from '../../fixtures/storyFixtures';

const base = { _id: 'grace-id', username: 'grace', name: 'Grace Hopper' };

const renderRow = (member: ConferenceMember, { canRing = true }: { canRing?: boolean } = {}) => {
	const AppRoot = mockAppRoot().withJohnDoe().build();
	const conference = buildConferenceContext({ viewer: { canRingUsers: canRing } });

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>
		</AppRoot>
	);

	return render(<CallMemberItem member={member} hasChatAccess onRing={jest.fn()} />, { wrapper });
};

// The ring window outlives the answer: a decline lands a second or two into a fifteen-second ring, so the
// member is still inside it. What the row must say is what they *did*, not that their phone is still ringing.
it('says a member declined, even while their ring window is still open', () => {
	const now = new Date();
	renderRow({ ...base, joined: false, ringingAt: now, declined: true, declinedAt: now });

	expect(screen.getByText('Declined')).toBeInTheDocument();
	expect(screen.queryByText('Ringing')).not.toBeInTheDocument();
});

it('says a member is ringing while they have not answered', () => {
	renderRow({ ...base, joined: false, ringingAt: new Date() });

	expect(screen.getByText('Ringing')).toBeInTheDocument();
});

// Declined and no longer ringing, so there is something to ring them back for — `getConferenceMemberStatus` is
// what decides that, and it is deliberately not what the two below are about.
const ringable: ConferenceMember = { ...base, joined: false, declined: true };

it('offers to ring a member who can be rung', () => {
	renderRow(ringable, { canRing: true });

	expect(screen.getByRole('button', { name: `Ring__name__` })).toBeInTheDocument();
});

// `video-conference.ring` refuses without the permission, so the button could only ever fail. A control that is
// offered and then rejected reads as the call being broken rather than as the workspace saying no.
it('does not offer to ring where the workspace would not let this caller ring', () => {
	renderRow(ringable, { canRing: false });

	expect(screen.queryByRole('button', { name: `Ring__name__` })).not.toBeInTheDocument();
});

describe('in a call that runs in this window', () => {
	const joined: ConferenceMember = { ...base, joined: true };

	const renderInCall = ({ muted = false, viewerId = 'someone-else' }: { muted?: boolean; viewerId?: string } = {}) => {
		const AppRoot = mockAppRoot().withJohnDoe().build();
		const renderMemberActivity = jest.fn((uid: string) => <span>level of {uid}</span>);
		const onMute = jest.fn();
		const conference = buildConferenceContext({ viewer: { uid: viewerId }, slots: { renderMemberActivity } });

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AppRoot>
				<ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>
			</AppRoot>
		);

		render(<CallMemberItem member={joined} hasChatAccess muted={muted} onMute={onMute} onRing={jest.fn()} />, { wrapper });

		return { onMute };
	};

	it('offers to mute a member whose microphone is on', () => {
		renderInCall();

		expect(screen.getByRole('button', { name: 'Mute__name__' })).toBeInTheDocument();
	});

	// The level meter is drawn by the application, which is what holds the audio; the row only says where it goes.
	it("draws the member's microphone level through the application's slot", () => {
		renderInCall();

		expect(screen.getByText(`level of ${base._id}`)).toBeInTheDocument();
	});

	// Silence is what everyone already hears, so a muted row says nothing — no button asking for it again.
	it('says nothing about a member who is already muted', () => {
		renderInCall({ muted: true });

		expect(screen.queryByRole('button', { name: 'Mute__name__' })).not.toBeInTheDocument();
		expect(screen.queryByText(`level of ${base._id}`)).not.toBeInTheDocument();
	});

	// Muting yourself is the call bar's job; asking yourself for silence through a list of other people is not.
	it('shows the reader their own level, but no way to mute themselves from the list', () => {
		renderInCall({ viewerId: base._id });

		expect(screen.queryByRole('button', { name: 'Mute__name__' })).not.toBeInTheDocument();
		expect(screen.getByText(`level of ${base._id}`)).toBeInTheDocument();
	});
});
