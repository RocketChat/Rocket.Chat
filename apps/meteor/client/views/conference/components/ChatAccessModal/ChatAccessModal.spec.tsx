import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatAccessModal from './ChatAccessModal';
import type { ConferenceChatAccess } from '../../hooks/useConferenceEmbedded';

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

const renderModal = (access: ConferenceChatAccess, onClose: () => void = jest.fn()) =>
	render(<ChatAccessModal callId='call-id' access={access} onClose={onClose} />, {
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

// The two actions are alternatives, and each is applied on its own — so a click on the second while the first
// was still in flight applied both: the members were added to the room *and* the chat moved out of it, which is
// the tradeoff the user picked plus the one they declined.
it('takes only one of the two actions, however fast the second is clicked', async () => {
	let release: (value: { rid: string; success: boolean }) => void = () => undefined;
	shareChat.mockImplementationOnce(
		() =>
			new Promise<{ rid: string; success: boolean }>((resolve) => {
				release = resolve;
			}) as never,
	);
	const onClose = jest.fn();

	renderModal(buildAccess(), onClose);

	await userEvent.click(screen.getByRole('button', { name: 'Add_to_room' }));
	await waitFor(() => expect(screen.getByRole('button', { name: 'Create_discussion' })).toBeDisabled());

	await userEvent.click(screen.getByRole('button', { name: 'Create_discussion' }));

	expect(shareChat).toHaveBeenCalledTimes(1);
	expect(shareChat).toHaveBeenCalledWith({ callId: 'call-id', mode: 'invite' });

	// Settled inside `act`, so the state the mutation lands in belongs to this test rather than leaking into the
	// next one: the request that was allowed through finishes, and finishing it is what closes the modal.
	await act(async () => {
		release({ rid: 'room-id', success: true });
	});

	expect(shareChat).toHaveBeenCalledTimes(1);
	expect(onClose).toHaveBeenCalled();
});
