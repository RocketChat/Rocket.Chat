import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceChat from './ConferenceChat';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { buildChatAccess } from './testFixtures';

// The room UI underneath needs the whole store-seeding apparatus, which isn't what these assertions are about.
jest.mock('./ConferenceStoresReady', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div data-testid='chat-room'>{children}</div>,
}));
jest.mock('./ConferenceRoom', () => ({ __esModule: true, default: () => null }));
jest.mock('./ConferenceThread', () => ({ __esModule: true, default: () => null }));

// `withJohnDoe` fixes the logged-in id, so the member without access has to be that same user.
const uid = 'john.doe';

const buildAccess = (membersWithoutAccess: string[]) => buildChatAccess({ membersWithoutAccess });

const renderChat = (chatAccess: ConferenceChatAccess) =>
	render(<ConferenceChat callId='call-id' rid='room-id' loading={false} chatAccess={chatAccess} onClose={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

it('tells a member whose chat was never shared what the situation is', () => {
	renderChat(buildAccess([uid]));

	expect(screen.getByText('Chat_not_shared_with_you')).toBeInTheDocument();
	expect(screen.queryByTestId('chat-room')).not.toBeInTheDocument();
});

it('shows the chat to a member who can read it', () => {
	renderChat(buildAccess(['someone-else']));

	expect(screen.getByTestId('chat-room')).toBeInTheDocument();
	expect(screen.queryByText('Chat_not_shared_with_you')).not.toBeInTheDocument();
});

// The banner about members who can't see the chat lives above the call, not in this panel — it is about the
// call rather than about whichever panel is open, and it must not move as panels change. What the panel carries
// instead is its own control in the header, which is what this pins: the banner's Review button being absent
// would be true of a panel that offered nothing at all.
it('offers chat access from its own header rather than carrying the notice', () => {
	renderChat(buildAccess(['someone-else']));

	expect(screen.getByRole('button', { name: '__count__participants_cannot_see_the_chat' })).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
});

// Nobody to tell about, nothing to offer — the header control is about other people, not about a decoration.
it('says nothing about chat access when everyone in the call can read it', () => {
	renderChat(buildAccess([]));

	expect(screen.queryByRole('button', { name: '__count__participants_cannot_see_the_chat' })).not.toBeInTheDocument();
});
