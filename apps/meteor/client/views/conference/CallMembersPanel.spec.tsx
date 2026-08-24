import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallMembersPanel from './CallMembersPanel';
import type { ConferenceMember } from './hooks/useConferenceEmbedded';
import { buildChatAccess, buildConferenceMember } from './testFixtures';

const ring = jest.fn(() => ({ rang: [], success: true }) as any);

const onMute = jest.fn();

const renderPanel = (
	members: ConferenceMember[],
	membersWithoutAccess: string[] = [],
	extras: { raisedHands?: Set<string>; mutedMembers?: Set<string> } = {},
) =>
	render(
		<CallMembersPanel
			callId='call-id'
			rid='room-id'
			members={members}
			chatAccess={buildChatAccess({ membersWithoutAccess })}
			raisedHands={extras.raisedHands}
			mutedMembers={extras.mutedMembers}
			onMute={onMute}
			onClose={jest.fn()}
		/>,
		{
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint('POST', '/v1/video-conference.ring', ring)
				.withEndpoint('GET', '/v1/channels.members', () => ({ members: [] }) as any)
				.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [] }) as any)
				.build(),
		},
	);

const rowFor = (username: string) => screen.getByText(username).closest('[role="listitem"], li') as HTMLElement;

// Each voice indicator is three bars inside an `aria-hidden` row — see `VoiceActivity`.
const voiceIndicatorCount = (container: HTMLElement) => container.querySelectorAll('div[aria-hidden="true"] > div').length / 3;

beforeEach(() => {
	ring.mockClear();
	onMute.mockClear();
});

it('lists every member', () => {
	renderPanel([buildConferenceMember({ _id: 'joiner', joined: true }), buildConferenceMember({ _id: 'invitee', joined: false })]);

	expect(screen.getByText('joiner')).toBeInTheDocument();
	expect(screen.getByText('invitee')).toBeInTheDocument();
});

// The two halves answer different questions — who is here, and who still isn't — so they are counted separately
// rather than as one list the reader has to sort themselves.
it('splits into who is in the call and who is not, with counts', () => {
	renderPanel([
		buildConferenceMember({ _id: 'joiner', joined: true }),
		buildConferenceMember({ _id: 'invitee', joined: false }),
		buildConferenceMember({ _id: 'leaver', joined: true, leftAt: new Date() }),
	]);

	expect(screen.getByText('In_call').parentElement).toHaveTextContent('1');
	expect(screen.getByText('Not_in_the_call').parentElement).toHaveTextContent('2');
});

it('leaves out a section nobody is in', () => {
	renderPanel([buildConferenceMember({ _id: 'joiner', joined: true })]);

	expect(screen.getByText('In_call')).toBeInTheDocument();
	expect(screen.queryByText('Not_in_the_call')).not.toBeInTheDocument();
});

describe('status', () => {
	// Only for members who aren't in the call — for those, the section they are in already says it.
	it.each([
		['invitee', { joined: false }, 'Waiting_for_answer'],
		['decliner', { joined: false, declined: true }, 'Declined'],
		['leaver', { joined: true, leftAt: new Date() }, 'Left'],
	])('labels %s', (id, state, label) => {
		renderPanel([buildConferenceMember({ _id: id, ...state })]);

		expect(screen.getByText(label)).toBeInTheDocument();
	});

	it('says a member is ringing while their phone still is', () => {
		renderPanel([buildConferenceMember({ _id: 'ringing', joined: false, ringingAt: new Date() })]);

		expect(screen.getByText('Ringing')).toBeInTheDocument();
	});
});

// Membership grants no room access, so a member can be in the call and unable to read its chat. It is the one
// thing about a member the other participants can act on, so it is worth showing against their name — as an
// icon, which is why this asserts on the label rather than on visible text.
it('flags a member who cannot read the chat, and only that member', () => {
	renderPanel(
		[buildConferenceMember({ _id: 'outsider', joined: true }), buildConferenceMember({ _id: 'insider', joined: true })],
		['outsider'],
	);

	const flags = screen.getAllByLabelText('No_chat_access');
	expect(flags).toHaveLength(1);
	expect(rowFor('outsider')).toContainElement(flags[0]);
});

describe('ringing a single member', () => {
	it('rings only the member asked for', async () => {
		renderPanel([buildConferenceMember({ _id: 'invitee', joined: false })]);

		await userEvent.click(screen.getByRole('button', { name: 'Ring__name__' }));

		await waitFor(() => expect(ring).toHaveBeenCalledWith({ callId: 'call-id', users: ['invitee'] }));
	});

	it.each([
		['a member who declined', { joined: false, declined: true }],
		['a member who left', { joined: true, leftAt: new Date() }],
	])('offers to ring %s back', (_case, state) => {
		renderPanel([buildConferenceMember({ _id: 'absentee', ...state })]);

		expect(screen.getByRole('button', { name: 'Ring__name__' })).toBeInTheDocument();
	});

	it('does not offer to ring someone already in the call', () => {
		renderPanel([buildConferenceMember({ _id: 'joiner', joined: true })]);

		expect(screen.queryByRole('button', { name: 'Ring__name__' })).not.toBeInTheDocument();
	});

	// There is nothing to ask for while their phone is ringing; the offer returns once the ring has run out.
	it('does not offer to ring a member who is being rung right now', () => {
		renderPanel([buildConferenceMember({ _id: 'ringing', joined: false, ringingAt: new Date() })]);

		expect(screen.queryByRole('button', { name: 'Ring__name__' })).not.toBeInTheDocument();
	});

	it('offers to ring a member whose ring has run out', () => {
		renderPanel([buildConferenceMember({ _id: 'ignored', joined: false, ringingAt: new Date(Date.now() - 60_000) })]);

		expect(screen.getByRole('button', { name: 'Ring__name__' })).toBeInTheDocument();
	});
});

// Adding people belongs with the list of who is already here, rather than with the chat.
it('offers to add people', async () => {
	renderPanel([buildConferenceMember({ _id: 'joiner', joined: true })]);

	await userEvent.click(screen.getByRole('button', { name: 'Add_people' }));

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
});

// Asking someone else for silence, which is a request their own client honours — this list is where the people in
// the call are, so it is where the asking belongs.
describe('asking a member to mute', () => {
	it('asks the member who is in the call', async () => {
		renderPanel([buildConferenceMember({ _id: 'joiner', joined: true })]);

		await userEvent.click(screen.getByRole('button', { name: 'Mute__name__' }));

		expect(onMute).toHaveBeenCalledWith('joiner');
	});

	// Nothing to mute for someone who isn't there, and a button that does nothing is worse than no button.
	it('offers nothing for a member who has not joined', () => {
		renderPanel([buildConferenceMember({ _id: 'invitee', joined: false })]);

		expect(screen.queryByRole('button', { name: 'Mute__name__' })).not.toBeInTheDocument();
	});

	// A muted member's row says nothing about their microphone. Everyone in the call already hears the silence, so
	// stating it once per row would repeat it for exactly the rows there is least to say about.
	it('says nothing at all about a muted member', () => {
		const { container } = renderPanel([buildConferenceMember({ _id: 'quiet', joined: true })], [], {
			mutedMembers: new Set(['quiet']),
		});

		expect(screen.queryByRole('button', { name: 'Mute__name__' })).not.toBeInTheDocument();
		expect(voiceIndicatorCount(container)).toBe(0);
	});

	// The useful case: a mic that is on, where whether it is picking anything up is worth seeing and asking for
	// silence is a thing someone might want to do.
	it('shows a live mic, with the way to quiet it beside it', () => {
		const { container } = renderPanel([buildConferenceMember({ _id: 'talker', joined: true })]);

		expect(voiceIndicatorCount(container)).toBe(1);
		expect(screen.getByRole('button', { name: 'Mute__name__' })).toBeInTheDocument();
	});

	// The reader gets the level and no button: muting yourself is what the call's own bar is for.
	it('shows the reader their own level without offering to mute them', () => {
		const { container } = renderPanel([buildConferenceMember({ _id: 'john.doe', joined: true })]);

		expect(voiceIndicatorCount(container)).toBe(1);
		expect(screen.queryByRole('button', { name: 'Mute__name__' })).not.toBeInTheDocument();
	});

	// Muting yourself is what the control on the call's own bar is for. `withJohnDoe` is the reader here.
	it('offers nothing against the reader themselves', () => {
		renderPanel([buildConferenceMember({ _id: 'john.doe', joined: true }), buildConferenceMember({ _id: 'someone', joined: true })]);

		expect(screen.getAllByRole('button', { name: 'Mute__name__' })).toHaveLength(1);
	});
});

// The queue's order is the call header's to state; here it is only who is waiting.
it('marks the members who have their hand up', () => {
	renderPanel([buildConferenceMember({ _id: 'waiting', joined: true }), buildConferenceMember({ _id: 'quiet', joined: true })], [], {
		raisedHands: new Set(['waiting']),
	});

	expect(screen.getAllByTitle('Raised_hand')).toHaveLength(1);
});
