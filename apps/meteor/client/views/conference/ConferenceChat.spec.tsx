import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceChat from './ConferenceChat';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';

// The room UI underneath needs the whole store-seeding apparatus, which isn't what these assertions are about.
jest.mock('./ConferenceRoomPreload', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div data-testid='chat-room'>{children}</div>,
}));
jest.mock('./ConferenceRoom', () => ({ __esModule: true, default: () => null }));

// `withJohnDoe` fixes the logged-in id, so the member without access has to be that same user.
const uid = 'john.doe';

const buildAccess = (membersWithoutAccess: string[]): ConferenceChatAccess => ({
	rid: 'room-id',
	name: 'general',
	type: 'c',
	membersWithoutAccess,
	canInvite: true,
	members: membersWithoutAccess.map((_id) => ({ _id, username: `user-${_id}`, name: `User ${_id}` })),
});

const renderChat = (chatAccess: ConferenceChatAccess) =>
	render(<ConferenceChat callId='call-id' rid='room-id' loading={false} chatAccess={chatAccess} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

it('tells a member whose chat was never shared what the situation is', () => {
	renderChat(buildAccess([uid]));

	expect(screen.getByText('Chat_not_shared_with_you')).toBeInTheDocument();
	expect(screen.queryByTestId('chat-room')).not.toBeInTheDocument();
	// The notice offers to resolve it, which this member can't do for themselves.
	expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
});

it('shows the chat, and who is missing from it, to a member who can read it', () => {
	renderChat(buildAccess(['someone-else']));

	expect(screen.getByTestId('chat-room')).toBeInTheDocument();
	expect(screen.queryByText('Chat_not_shared_with_you')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
});
