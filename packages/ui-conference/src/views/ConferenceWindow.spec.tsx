import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import ConferenceWindow from './ConferenceWindow';
import type { ConferenceContextValue, ConferencePanel } from '../context/ConferenceContext';
import { ConferenceContext } from '../context/ConferenceContext';
import { buildConferenceContext } from '../fixtures/storyFixtures';

/**
 * A thread is shown inside the chat panel, so it cannot outlive it. The window is not the only thing that can
 * close that panel — a provider's own chat button reaches `panel.set` straight past the window's own toggle —
 * so the rule has to follow the panel rather than the click that moved it.
 */
const close = jest.fn();

const renderWindow = (activePanel: ConferencePanel | undefined) => {
	const AppRoot = mockAppRoot().withJohnDoe().build();

	const value: ConferenceContextValue = buildConferenceContext({
		// Embedded, so the window renders without an iframe: the frame loading has nothing to do with the rule
		// under test and its `onLoad` only adds an unactioned state update to the output.
		session: { joined: true, embedded: true, loading: false },
		room: { rid: 'room-id', loading: false },
		panel: { active: activePanel, set: jest.fn() },
		thread: { tmid: 'a-thread', open: jest.fn(), close },
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>
		</AppRoot>
	);

	return render(<ConferenceWindow />, { wrapper });
};

beforeEach(() => {
	close.mockClear();
});

it('keeps the thread while the chat panel it lives in is open', () => {
	renderWindow('chat');

	expect(close).not.toHaveBeenCalled();
});

// The case the provider's own button reaches: the panel moves without the window's toggle being the one to
// move it. Left alone, reopening the chat brought the previous thread back with it.
it('closes the thread when the panel moves off the chat', () => {
	renderWindow('members');

	expect(close).toHaveBeenCalled();
});

it('closes the thread when every panel is shut', () => {
	renderWindow(undefined);

	expect(close).toHaveBeenCalled();
});
