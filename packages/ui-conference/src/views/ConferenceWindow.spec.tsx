import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { DeviceSelection } from '@rocket.chat/ui-media';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ConferenceWindow from './ConferenceWindow';
import type { CallState } from '../call/context';
import { CallActionsProvider, CallStateProvider } from '../call/context';
import type { ConferenceContextValue, ConferencePanel } from '../context/ConferenceContext';
import { ConferenceContext } from '../context/ConferenceContext';
import type { VideoQualitySelection } from '../devices/VideoQualityContext';
import { VideoQualityProvider } from '../devices/VideoQualityContext';
import { buildConferenceContext } from '../fixtures/storyFixtures';

const callState: CallState = {
	self: {
		id: 'john.doe',
		displayName: 'John Doe',
		muted: false,
		cameraOn: false,
		screenSharing: false,
		speakingWhileMuted: false,
	},
	remoteParticipants: [],
	startedAt: new Date(),
	connectionState: 'connected',
};

const actions = {
	toggleMic: jest.fn(),
	toggleCamera: jest.fn(),
	toggleScreenShare: jest.fn(),
	leave: jest.fn(),
};

const deviceSelection: DeviceSelection = {
	devices: [],
	selectedIds: {},
	select: jest.fn(),
};

const videoQuality: VideoQualitySelection = { quality: 'auto', qualities: [], pending: false, select: jest.fn() };

/** What a provider running the call in this window provides around it. */
const CallContexts = ({ children }: { children: ReactNode }) => (
	<CallStateProvider value={callState}>
		<CallActionsProvider value={actions}>
			<DeviceSelectionProvider value={deviceSelection}>
				<VideoQualityProvider value={videoQuality}>{children}</VideoQualityProvider>
			</DeviceSelectionProvider>
		</CallActionsProvider>
	</CallStateProvider>
);

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
			<CallContexts>
				<ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>
			</CallContexts>
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
	const renderNative = () => {
		const AppRoot = mockAppRoot().withJohnDoe().build();

		const value = buildConferenceContext({
			session: { joined: true, embedded: true, loading: false },
			room: { rid: 'room-id', loading: false },
		});

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AppRoot>
				<CallContexts>
					<ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>
				</CallContexts>
			</AppRoot>
		);

		return render(<ConferenceWindow />, { wrapper });
	};

	// The call's header and controls belong in this window's bars, not in a strip of the call's own.
	it("puts the call's stage in the window and its controls in the window's bar", () => {
		renderNative();

		expect(screen.getByRole('region', { name: 'Video_Conference' })).toBeInTheDocument();
		expect(screen.getByRole('contentinfo')).toContainElement(screen.getByRole('button', { name: 'Leave_call' }));
	});

	// A provider at an address of its own draws its call inside the frame, controls and all, and provides no call
	// contexts — so nothing of the call's own may be rendered for it.
	it('renders none of the call for a provider at an address of its own', () => {
		const AppRoot = mockAppRoot().withJohnDoe().build();
		const value = buildConferenceContext({
			session: { url: 'https://provider.example/call', joined: true, embedded: false, loading: false, retry: jest.fn() },
			room: { rid: 'room-id', loading: false },
		});

		render(
			<AppRoot>
				<ConferenceContext.Provider value={value}>
					<ConferenceWindow />
				</ConferenceContext.Provider>
			</AppRoot>,
		);

		expect(screen.queryByRole('button', { name: 'Leave_call' })).not.toBeInTheDocument();
	});
});

// Starting a call joins on the start screen, so this window opens joined while the call it belongs to is still being
// read — and an embedded provider is only known from that read. Until then it is loading, not a failed join.
it('waits for the call rather than reporting a join with no URL', () => {
	const AppRoot = mockAppRoot().withJohnDoe().build();
	const value = buildConferenceContext({
		session: { joined: true, embedded: false, loading: false },
		room: { rid: 'room-id', loading: true },
		slots: { loading: <div role='progressbar' /> },
	});

	render(
		<AppRoot>
			<ConferenceContext.Provider value={value}>
				<ConferenceWindow />
			</ConferenceContext.Provider>
		</AppRoot>,
	);

	expect(screen.getByRole('progressbar')).toBeInTheDocument();
	expect(screen.queryByText('error-videoconf-unexpected')).not.toBeInTheDocument();
});
