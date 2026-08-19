import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';

import OngoingCall from './OngoingCall';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { DragContext } from '../../components';
import MediaCallViewContext from '../../context/MediaCallViewContext';
import type { PeerInfo, SessionState } from '../../context/definitions';

const externalPeer = { number: '+15551234567' } as PeerInfo;
const internalPeer = { displayName: 'John Doe', userId: 'u1', username: 'john.doe' } as PeerInfo;

type RenderOptions = {
	peerInfo: PeerInfo;
	inline?: boolean;
	localScreenActive?: boolean;
};

const renderView = (Component: ComponentType, { peerInfo, inline = false, localScreenActive = false }: RenderOptions) => {
	const sessionState = {
		state: 'ongoing',
		connectionState: 'CONNECTED',
		peerInfo,
		transferredBy: undefined,
		hidden: false,
		muted: false,
		held: false,
		remoteMuted: false,
		remoteHeld: false,
		callId: 'call-1',
		supportedFeatures: ['audio', 'screen-share', 'hold', 'transfer'],
	} as SessionState;

	const streams = localScreenActive ? { localScreen: { active: true, stream: null } } : {};

	const viewContextValue = {
		sessionState,
		onClickDirectMessage: undefined,
		onMute: jest.fn(),
		onHold: jest.fn(),
		onDeviceChange: jest.fn(),
		onForward: jest.fn(),
		onTone: jest.fn(),
		onEndCall: jest.fn(),
		onCall: jest.fn(),
		onAccept: jest.fn(),
		onSelectPeer: jest.fn(),
		onToggleScreenSharing: jest.fn(),
		streams,
		widgetPositionTracker: undefined,
	} as any;

	// Inline means "no draggable context" (see WidgetDraggableContext) — floating widgets
	// are always wrapped in a drag provider, so only the floating case supplies one here.
	const dragContextValue = {
		draggableRef: () => undefined,
		boundingRef: () => undefined,
		handleRef: () => undefined,
	};

	const Wrapper = ({ children }: { children: ReactNode }) => {
		const view = <MediaCallViewContext.Provider value={viewContextValue}>{children}</MediaCallViewContext.Provider>;
		return inline ? view : <DragContext.Provider value={dragContextValue}>{view}</DragContext.Provider>;
	};

	return render(
		<Wrapper>
			<Component />
		</Wrapper>,
		{ wrapper: mockAppRoot().build() },
	);
};

describe('Ongoing call dialpad (DMV-16)', () => {
	it('renders the collapsible dialpad toggle for any floating ongoing call (internal included)', () => {
		renderView(OngoingCall, { peerInfo: internalPeer, inline: false });

		// floating: toggle present for every call, keypad collapsed by default
		expect(screen.getByRole('button', { name: 'Dialpad' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
	});

	it('renders the collapsible dialpad toggle for external (SIP) calls when floating', () => {
		renderView(OngoingCall, { peerInfo: externalPeer, inline: false });

		expect(screen.getByRole('button', { name: 'Dialpad' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
	});

	it('renders the dialpad expanded (no toggle) for external calls when inline', () => {
		renderView(OngoingCall, { peerInfo: externalPeer, inline: true });

		// inline: no floating toggle, the expanded keypad is mounted (the '#' key proves it)
		expect(screen.queryByRole('button', { name: 'Dialpad' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: '#' })).toBeInTheDocument();
	});

	it('does not render the inline dialpad for internal (non-SIP) calls', () => {
		renderView(OngoingCall, { peerInfo: internalPeer, inline: true });

		expect(screen.queryByRole('button', { name: 'Dialpad' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
	});
});

describe('Ongoing call with screen share dialpad (DMV-16)', () => {
	// The screen-share view only exposes the dialpad inline (sidebar rail), via <MediaCallDialpad />.
	it('hides the inline dialpad while screen sharing is active', () => {
		renderView(OngoingCallWithScreen, { peerInfo: externalPeer, inline: true, localScreenActive: true });

		expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
	});

	it('shows the inline dialpad when screen sharing is supported but not active', () => {
		renderView(OngoingCallWithScreen, { peerInfo: externalPeer, inline: true, localScreenActive: false });

		expect(screen.getByRole('button', { name: '#' })).toBeInTheDocument();
	});
});
