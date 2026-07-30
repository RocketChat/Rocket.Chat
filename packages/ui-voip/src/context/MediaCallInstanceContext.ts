import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { RefObject } from 'react';
import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from '../components';
import type { PeerInfo } from './definitions';
import type { MediaSessionStateSubscription } from '../providers/useMediaSessionStateSubscription';
import { defaultSessionInfo } from '../providers/useMediaSessionStateSubscription';

export type Signals = {
	toggleWidget: { peerInfo?: PeerInfo };
};

export type AvailableViews = 'room' | 'popout' | 'widget';

type RegisterView = (view: AvailableViews) => void;
type UnregisterView = (view: AvailableViews) => void;

type WidgetVisibility = 'open' | 'closed';

export type MediaCallInstanceContextValue = {
	instance: MediaSignalingSession | undefined;
	signalEmitter: Emitter<Signals>;
	audioElement: RefObject<HTMLAudioElement | null> | undefined;
	openRoomId: string | undefined;

	currentViews: AvailableViews[];
	registerView: RegisterView;
	unregisterView: UnregisterView;

	stateSubscription: MediaSessionStateSubscription;
	widgetVisibility: WidgetVisibility;
	targetPeer: PeerInfo | undefined;

	setOpenRoomId: (openRoomId: string | undefined) => void;
	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	openWidget: (peerInfo?: PeerInfo) => void;
	closeWidget: () => void;
	setTargetPeer: (peerInfo?: PeerInfo) => void;
};

export const defaultContextValue = {
	instance: undefined,
	signalEmitter: new Emitter<Signals>(),
	audioElement: undefined,
	openRoomId: undefined,
	setOpenRoomId: () => undefined,
	getAutocompleteOptions: () => Promise.resolve([]),
	currentViews: [],
	registerView: () => undefined,
	unregisterView: () => undefined,
	openWidget: () => undefined,
	closeWidget: () => undefined,
	setTargetPeer: () => undefined,
	widgetVisibility: 'closed' as const,
	targetPeer: undefined,
	stateSubscription: {
		subscribe: () => () => undefined,
		getSnapshot: () => defaultSessionInfo,
	},
};

export const MediaCallInstanceContext = createContext<MediaCallInstanceContextValue>(defaultContextValue);

export const useMediaCallInstance = (): MediaCallInstanceContextValue => useContext(MediaCallInstanceContext);
