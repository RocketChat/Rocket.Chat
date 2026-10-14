import { describe, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ConferenceChatAccess, ConferenceContextValue } from '@rocket.chat/ui-conference';
import { ConferenceContext, buildChatAccess, defaultConferenceContextValue } from '@rocket.chat/ui-conference';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import proxyquire from 'proxyquire';
import type { ReactNode } from 'react';

// `withJohnDoe` fixes the logged-in id, so the member without access has to be that same user.
const uid = 'john.doe';

const buildAccess = (membersWithoutAccess: string[]) => buildChatAccess({ membersWithoutAccess });

const { default: ConferenceChat } = proxyquire.noCallThru().load<typeof import('./ConferenceChat')>('./ConferenceChat', {
	'./ConferenceRoomPanel': {
		__esModule: true,
		default: () => null,
	},
	'../root/hooks/useMainReady': {
		useMainReady: () => true,
	},
});

const renderChat = (chatAccess: ConferenceChatAccess) => {
	const AppRoot = mockAppRoot().withJohnDoe().build();

	const conference: ConferenceContextValue = {
		...defaultConferenceContextValue,
		callId: 'call-id',
		room: { ...defaultConferenceContextValue.room, rid: 'room-id', loading: false, chatAccess },
	};

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>
		</AppRoot>
	);

	return render(<ConferenceChat />, { wrapper });
};

const cases = [
	['the chat was never shared with this member', [uid]],
	['this member can read the chat, and someone else cannot', ['someone-else']],
	['everyone in the call can read the chat', []],
] as const;

describe('ConferenceChat', () => {
	cases.forEach(([_case, membersWithoutAccess]) => {
		test(`renders what it shows when ${_case}`, (t) => {
			const { baseElement } = renderChat(buildAccess([...membersWithoutAccess]));

			t.assert.snapshot(baseElement);
		});
	});

	cases.forEach(([_case, membersWithoutAccess]) => {
		test(`has no a11y violations when ${_case}`, async () => {
			const { container } = renderChat(buildAccess([...membersWithoutAccess]));

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
	});
});
