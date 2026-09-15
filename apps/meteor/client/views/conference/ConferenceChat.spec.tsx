import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import ConferenceChat from './ConferenceChat';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { buildChatAccess } from './testFixtures';

/**
 * What this panel decides is what it shows: the chat, or the screen saying the chat was never shared with this
 * member — and, in its header, whether there is anything to offer about the people who cannot read it. So each
 * case is a render and the snapshot is the answer.
 *
 * Snapshotted from the component rather than from stories, which it has none of: the room underneath needs the
 * cached stores seeded, and what seeds them is the page above — so it is stubbed out here to leave this panel's
 * own decisions visible.
 */
jest.mock('./ConferenceRoomPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../root/hooks/useMainReady', () => ({ useMainReady: () => true }));

// `withJohnDoe` fixes the logged-in id, so the member without access has to be that same user.
const uid = 'john.doe';

const buildAccess = (membersWithoutAccess: string[]) => buildChatAccess({ membersWithoutAccess });

const renderChat = (chatAccess: ConferenceChatAccess) =>
	render(<ConferenceChat callId='call-id' rid='room-id' loading={false} chatAccess={chatAccess} onClose={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

const cases = [
	['the chat was never shared with this member', [uid]],
	['this member can read the chat, and someone else cannot', ['someone-else']],
	['everyone in the call can read the chat', []],
] as const;

describe('ConferenceChat', () => {
	test.each(cases)('renders what it shows when %s', (_case, membersWithoutAccess) => {
		const { baseElement } = renderChat(buildAccess([...membersWithoutAccess]));

		expect(baseElement).toMatchSnapshot();
	});

	test.each(cases)('has no a11y violations when %s', async (_case, membersWithoutAccess) => {
		const { container } = renderChat(buildAccess([...membersWithoutAccess]));

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
