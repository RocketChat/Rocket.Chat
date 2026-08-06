import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatAccessModal from './ChatAccessModal';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';

const member = { _id: 'outsider-id', username: 'outsider', name: 'Outsider Person' };

const buildAccess = (overrides: Partial<ConferenceChatAccess> = {}): ConferenceChatAccess => ({
	rid: 'room-id',
	name: 'general',
	type: 'c',
	membersWithoutAccess: [member._id],
	canInvite: true,
	members: [member],
	...overrides,
});

const shareChat = jest.fn(() => ({ rid: 'room-id', success: true }));

const renderModal = (access: ConferenceChatAccess) =>
	render(<ChatAccessModal callId='call-id' access={access} onClose={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/video-conference.share-chat', shareChat as any)
			.build(),
	});

beforeEach(() => {
	shareChat.mockClear();
});

it('names the members who cannot see the chat', () => {
	renderModal(buildAccess());

	expect(screen.getByText(member.username)).toBeInTheDocument();
});

// Which of the two leads is `chatAccessLeadsWithDiscussion`, pinned on the function itself in
// `tests/unit/lib/videoConference/chatAccess.spec.ts`. What is worth asserting here is that the modal is wired
// to it at all — and that costs one case, not one per room type.
it('leads with the invite for a public room, whose history is already open', () => {
	renderModal(buildAccess({ type: 'c' }));

	expect(screen.getByRole('button', { name: 'Add_to_room' })).toHaveClass('rcx-button--primary');
	expect(screen.getByRole('button', { name: 'Create_discussion' })).not.toHaveClass('rcx-button--primary');
});

it('offers only the discussion when the room cannot take new members', () => {
	renderModal(buildAccess({ type: 'd', canInvite: false }));

	expect(screen.getByRole('button', { name: 'Create_discussion' })).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Add_to_room' })).not.toBeInTheDocument();
});

it.each([
	['Add_to_room', 'invite'],
	['Create_discussion', 'discussion'],
])('asks the server for %s by mode', async (label, mode) => {
	renderModal(buildAccess());

	await userEvent.click(screen.getByRole('button', { name: label }));

	await waitFor(() => expect(shareChat).toHaveBeenCalledWith({ callId: 'call-id', mode }));
});
