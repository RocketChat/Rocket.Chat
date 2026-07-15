import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { RefObject } from 'react';
import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from '../components';
import type { PeerInfo } from './definitions';

export type Signals = {
	toggleWidget: { peerInfo?: PeerInfo };
};

export type AvailableViews = 'room' | 'popout' | 'widget';

type RegisterView = (view: AvailableViews) => void;
type UnregisterView = (view: AvailableViews) => void;

type MediaCallInstanceContextValue = {
	instance: MediaSignalingSession | undefined;
	signalEmitter: Emitter<Signals>;
	audioElement: RefObject<HTMLAudioElement | null> | undefined;
	openRoomId: string | undefined;
	currentViews: AvailableViews[];
	setOpenRoomId: (openRoomId: string | undefined) => void;
	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	registerView: RegisterView;
	unregisterView: UnregisterView;
};

export const MediaCallInstanceContext = createContext<MediaCallInstanceContextValue>({
	instance: undefined,
	signalEmitter: new Emitter<Signals>(),
	audioElement: undefined,
	openRoomId: undefined,
	setOpenRoomId: () => undefined,
	getAutocompleteOptions: () => Promise.resolve([]),
	currentViews: [],
	registerView: () => undefined,
	unregisterView: () => undefined,
});

export const useMediaCallInstance = (): MediaCallInstanceContextValue => useContext(MediaCallInstanceContext);
