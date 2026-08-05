import { UserStatus } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { MockedInstanceProviderProps } from './MockedInstanceProvider';
import MockedInstanceProvider, { avatarUrl, mockedPeers } from './MockedInstanceProvider';
import MediaCallViewContext from '../context/MediaCallViewContext';
import type { State, PeerInfo, SessionState } from '../context/definitions';

export type MockedMediaCallProviderProps = {
	children: ReactNode;
	state?: State;
	transferredBy?: string;
	remoteMuted?: boolean;
	remoteHeld?: boolean;
	muted?: boolean;
	held?: boolean;
	onClickDirectMessage?: () => void;
	instanceProps?: Partial<MockedInstanceProviderProps>;
};

const MockedMediaCallProvider = ({
	children,
	state = 'none',
	onClickDirectMessage = undefined,
	transferredBy = undefined,
	remoteMuted = false,
	remoteHeld = false,
	muted = false,
	held = false,
	instanceProps,
}: MockedMediaCallProviderProps) => {
	const [peerInfo, setPeerInfo] = useState<PeerInfo | undefined>({
		displayName: 'John Doe',
		userId: '1234567890',
		avatarUrl,
		username: 'john.doe',
		callerId: '1234567890',
		status: UserStatus.ONLINE,
	});
	const [widgetState, setWidgetState] = useState<State>(state);
	const [mutedState, setMutedState] = useState(muted);
	const [heldState, setHeldState] = useState(held);

	const onMute = () => setMutedState((prev) => !prev);
	const onHold = () => setHeldState((prev) => !prev);

	const clearState = () => {
		setMutedState(false);
		setHeldState(false);
	};

	const onDeviceChange = (device: any) => {
		console.log('device', device);
	};

	const onForward = () => {
		console.log('forward');
		clearState();
		setWidgetState('none');
	};

	const onTone = (tone: string) => {
		console.log('tone', tone);
	};

	const onEndCall = () => {
		clearState();
		setWidgetState('none');
	};

	const getPeerInfo = (id: string) => {
		const peer = mockedPeers.find((item) => item.value === id);
		if (!peer) {
			return Promise.resolve(undefined);
		}

		return Promise.resolve({
			displayName: peer.label,
			userId: peer.value,
			avatarUrl: peer.avatarUrl,
			username: peer.identifier,
			callerId: peer.value,
		});
	};

	const onCall = async (id?: string) => {
		if (id) {
			setPeerInfo(await getPeerInfo(id));
		}

		switch (widgetState) {
			case 'ringing':
				setWidgetState('ongoing');
				break;
			case 'none':
				setWidgetState('calling');
				setTimeout(() => {
					setWidgetState('ongoing');
				}, 1000);
				break;
			case 'calling':
				setWidgetState('none');
				break;
		}
	};

	const onSelectPeer = (peerInfo: PeerInfo) => {
		setPeerInfo(peerInfo);
	};

	const sessionState = {
		state: widgetState,
		connectionState: 'CONNECTED' as const,
		peerInfo,
		transferredBy,
		hidden: false,
		muted: mutedState,
		held: heldState,
		remoteMuted,
		remoteHeld,
		callId: undefined,
		supportedFeatures: ['audio', 'screen-share', 'transfer', 'hold'],
	} as SessionState;

	const contextValue = {
		sessionState,
		targetPeer: peerInfo,
		onClickDirectMessage,
		onMute,
		onHold,
		onDeviceChange,
		onForward,
		onTone,
		onEndCall,
		onCall,
		onAccept: onCall,
		onSelectPeer,
		streams: {},
		onToggleScreenSharing: () => undefined,
		onOpenPopout: () => undefined,
		onClosePopout: () => undefined,
	};

	return (
		<MockedInstanceProvider sessionState={sessionState} {...instanceProps}>
			<MediaCallViewContext.Provider value={contextValue}>{children}</MediaCallViewContext.Provider>
		</MockedInstanceProvider>
	);
};

export default MockedMediaCallProvider;
