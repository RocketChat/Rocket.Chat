import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from './components';

type InternalPeerInfo = {
	name: string;
	avatarUrl: string;
	identifier: string;
};

type ExternalPeerInfo = {
	number: string;
};

type PeerInfo = InternalPeerInfo | ExternalPeerInfo;

type State = 'closed' | 'new' | 'calling' | 'ringing' | 'ongoing';

type MediaCallContextType = {
	state: State;

	peerInfo: PeerInfo | undefined;

	muted: boolean;
	held: boolean;
	onMute: () => void;
	onHold: () => void;

	onDeviceChange: (device: string) => void;
	onForward: () => void;
	onTone: (tone: string) => void;

	// onCall and onEndCall are used to start/accept and reject/end a call
	onEndCall: () => void;
	onCall: () => void;

	onToggleWidget: () => void;

	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
};

const MediaCallContext = createContext<MediaCallContextType>({
	state: 'closed',

	peerInfo: undefined,

	muted: false,
	held: false,
	onMute: () => undefined,
	onHold: () => undefined,

	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,

	onEndCall: () => undefined,
	onCall: () => undefined,

	onToggleWidget: () => undefined,

	getAutocompleteOptions: () => Promise.resolve([]),
});

export const useMediaCallContext = (): MediaCallContextType => {
	return useContext(MediaCallContext);
};

export default MediaCallContext;
