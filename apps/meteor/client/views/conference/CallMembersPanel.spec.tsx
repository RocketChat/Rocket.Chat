import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallMembersPanel from './CallMembersPanel';
import type { ConferenceMember } from './hooks/useCallOutcome';

const member = (overrides: Partial<ConferenceMember> & Pick<ConferenceMember, '_id'>): ConferenceMember => ({
	username: overrides._id,
	name: `Name of ${overrides._id}`,
	...overrides,
});

const ring = jest.fn(() => ({ rang: [], success: true }) as any);

const renderPanel = (members: ConferenceMember[], membersWithoutChatAccess: string[] = []) =>
	render(
		<CallMembersPanel
			callId='call-id'
			rid='room-id'
			members={members}
			membersWithoutChatAccess={membersWithoutChatAccess}
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

beforeEach(() => {
	ring.mockClear();
});

it('lists every member', () => {
	renderPanel([member({ _id: 'joiner', joined: true }), member({ _id: 'invitee', joined: false })]);

	expect(screen.getByText('joiner')).toBeInTheDocument();
	expect(screen.getByText('invitee')).toBeInTheDocument();
});

// The two halves answer different questions — who is here, and who still isn't — so they are counted separately
// rather than as one list the reader has to sort themselves.
it('splits into who is in the call and who is not, with counts', () => {
	renderPanel([
		member({ _id: 'joiner', joined: true }),
		member({ _id: 'invitee', joined: false }),
		member({ _id: 'leaver', joined: true, leftAt: new Date() }),
	]);

	expect(screen.getByText('In_call').parentElement).toHaveTextContent('1');
	expect(screen.getByText('Not_in_the_call').parentElement).toHaveTextContent('2');
});

it('leaves out a section nobody is in', () => {
	renderPanel([member({ _id: 'joiner', joined: true })]);

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
		renderPanel([member({ _id: id, ...state })]);

		expect(screen.getByText(label)).toBeInTheDocument();
	});

	it('says a member is ringing while their phone still is', () => {
		renderPanel([member({ _id: 'ringing', joined: false, ringingAt: new Date() })]);

		expect(screen.getByText('Ringing')).toBeInTheDocument();
	});
});

// Membership grants no room access, so a member can be in the call and unable to read its chat. It is the one
// thing about a member the other participants can act on, so it is worth showing against their name — as an
// icon, which is why this asserts on the label rather than on visible text.
it('flags a member who cannot read the chat, and only that member', () => {
	renderPanel([member({ _id: 'outsider', joined: true }), member({ _id: 'insider', joined: true })], ['outsider']);

	const flags = screen.getAllByLabelText('No_chat_access');
	expect(flags).toHaveLength(1);
	expect(rowFor('outsider')).toContainElement(flags[0]);
});

describe('ringing a single member', () => {
	it('rings only the member asked for', async () => {
		renderPanel([member({ _id: 'invitee', joined: false })]);

		await userEvent.click(screen.getByRole('button', { name: 'Ring__name__' }));

		await waitFor(() => expect(ring).toHaveBeenCalledWith({ callId: 'call-id', users: ['invitee'] }));
	});

	it.each([
		['a member who declined', { joined: false, declined: true }],
		['a member who left', { joined: true, leftAt: new Date() }],
	])('offers to ring %s back', (_case, state) => {
		renderPanel([member({ _id: 'absentee', ...state })]);

		expect(screen.getByRole('button', { name: 'Ring__name__' })).toBeInTheDocument();
	});

	it('does not offer to ring someone already in the call', () => {
		renderPanel([member({ _id: 'joiner', joined: true })]);

		expect(screen.queryByRole('button', { name: 'Ring__name__' })).not.toBeInTheDocument();
	});

	// There is nothing to ask for while their phone is ringing; the offer returns once the ring has run out.
	it('does not offer to ring a member who is being rung right now', () => {
		renderPanel([member({ _id: 'ringing', joined: false, ringingAt: new Date() })]);

		expect(screen.queryByRole('button', { name: 'Ring__name__' })).not.toBeInTheDocument();
	});

	it('offers to ring a member whose ring has run out', () => {
		renderPanel([member({ _id: 'ignored', joined: false, ringingAt: new Date(Date.now() - 60_000) })]);

		expect(screen.getByRole('button', { name: 'Ring__name__' })).toBeInTheDocument();
	});
});

// Adding people belongs with the list of who is already here, rather than with the chat.
it('offers to add people', async () => {
	renderPanel([member({ _id: 'joiner', joined: true })]);

	await userEvent.click(screen.getByRole('button', { name: 'Add_people' }));

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
});
