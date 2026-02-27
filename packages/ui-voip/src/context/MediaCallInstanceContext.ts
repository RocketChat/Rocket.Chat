import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { RefObject } from 'react';
import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from '../components';
import type { PeerInfo } from './definitions';

export type Signals = {
	toggleWidget: { peerInfo?: PeerInfo };
};

type MediaCallInstanceContextValue = {
	instance: MediaSignalingSession | undefined;
	signalEmitter: Emitter<Signals>;
	audioElement: RefObject<HTMLAudioElement> | undefined;
	openRoomId: string | undefined;
	setOpenRoomId: (openRoomId: string | undefined) => void;
	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
};

export const MediaCallInstanceContext = createContext<MediaCallInstanceContextValue>({
	instance: undefined,
	signalEmitter: new Emitter<Signals>(),
	audioElement: undefined,
	openRoomId: undefined,
	setOpenRoomId: () => undefined,
	getAutocompleteOptions: () => Promise.resolve([]),
});

export const useMediaCallInstance = (): MediaCallInstanceContextValue => useContext(MediaCallInstanceContext);
