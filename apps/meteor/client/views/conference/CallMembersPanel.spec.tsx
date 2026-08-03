import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
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

const rowFor = (username: string) => screen.getByText(username).closest('div[class]')?.parentElement as HTMLElement;

beforeEach(() => {
	ring.mockClear();
});

it('lists every member with a count', () => {
	renderPanel([member({ _id: 'joiner', joined: true }), member({ _id: 'invitee', joined: false })]);

	expect(screen.getByRole('heading')).toHaveTextContent('Members (2)');
	expect(screen.getByText('joiner')).toBeInTheDocument();
	expect(screen.getByText('invitee')).toBeInTheDocument();
});

describe('status', () => {
	it.each([
		['joiner', { joined: true }, 'In_call'],
		['invitee', { joined: false }, 'Waiting_for_answer'],
		['decliner', { joined: false, declined: true }, 'Declined'],
		['leaver', { joined: true, leftAt: new Date() }, 'Left'],
	])('labels %s', (id, state, label) => {
		renderPanel([member({ _id: id, ...state })]);

		expect(screen.getByText(label)).toBeInTheDocument();
	});
});

// Membership grants no room access, so a member can be in the call and unable to read its chat. It is the one
// thing about a member the other participants can act on, so it is worth showing against their name.
it('flags a member who cannot read the chat', () => {
	renderPanel([member({ _id: 'outsider', joined: true }), member({ _id: 'insider', joined: true })], ['outsider']);

	expect(screen.getAllByText('No_chat_access')).toHaveLength(1);
	expect(within(rowFor('outsider')).getByText('No_chat_access')).toBeInTheDocument();
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
});

// Adding people belongs with the list of who is already here, rather than with the chat.
it('offers to add people', async () => {
	renderPanel([member({ _id: 'joiner', joined: true })]);

	await userEvent.click(screen.getByRole('button', { name: 'Add_people' }));

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
});
