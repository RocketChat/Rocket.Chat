import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
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

describe('a call that runs in this window', () => {
	const renderNative = (overrides: Partial<ConferenceContextValue> = {}) => {
		const AppRoot = mockAppRoot().withJohnDoe().build();
		const renderCall = jest.fn(() => <div>the call</div>);

		const value = buildConferenceContext({
			session: { joined: true, embedded: true, loading: false },
			room: { rid: 'room-id', loading: false },
			...overrides,
			slots: { renderCall, diagnostics: <div>connection info</div>, ...overrides.slots },
		});

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AppRoot>
				<ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>
			</AppRoot>
		);

		return { ...render(<ConferenceWindow />, { wrapper }), renderCall };
	};

	// The call brings its own header and controls, and they belong in this window's bars rather than in a strip of
	// the call's own — so the call is handed the two places, and both have to be on the page by the time it is.
	it('hands the call the header and controls hosts, already mounted in the window', () => {
		const { renderCall } = renderNative();

		expect(screen.getByText('the call')).toBeInTheDocument();
		const [[hosts]] = renderCall.mock.calls as unknown as [[{ header: HTMLElement; controls: HTMLElement }]];
		expect(document.body.contains(hosts.header)).toBe(true);
		expect(document.body.contains(hosts.controls)).toBe(true);
	});

	// A provider at an address of its own draws its call inside the frame, controls and all; handing it hosts too
	// would give it two places to put the same buttons.
	it('asks nothing of the slot for a provider at an address of its own', () => {
		const { renderCall } = renderNative({
			session: { url: 'https://provider.example/call', joined: true, embedded: false, loading: false, retry: jest.fn() },
		});

		expect(renderCall).not.toHaveBeenCalled();
	});

	it('opens the connection panel the application builds', () => {
		renderNative({ panel: { active: 'diagnostics', set: jest.fn() } });

		expect(screen.getByText('connection info')).toBeInTheDocument();
	});

	// The call reports a hand by member id; the window is what knows who that is.
	it('names the raised hands from the membership', () => {
		renderNative({
			call: { ...buildConferenceContext().call, members: [{ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }] },
			media: { raisedHands: ['ada'], mutedMembers: new Set(), presenters: [] },
		});

		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
	});
});
