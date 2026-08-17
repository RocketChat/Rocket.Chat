import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { RefObject } from 'react';
import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from '../components';
import type { PeerInfo } from './definitions';

export type AvailableViews = 'room' | 'popout' | 'widget';

type RegisterView = (view: AvailableViews) => void;
type UnregisterView = (view: AvailableViews) => void;

type WidgetVisibility = 'open' | 'closed';

export type MediaCallInstanceContextValue = {
	instance: MediaSignalingSession | undefined;
	audioElement: RefObject<HTMLAudioElement | null> | undefined;
	openRoomId: string | undefined;

	currentViews: Set<AvailableViews>;
	registerView: RegisterView;
	unregisterView: UnregisterView;

	targetWidgetVisibility: WidgetVisibility;
	targetPeer: PeerInfo | undefined;

	setOpenRoomId: (openRoomId: string | undefined) => void;
	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	openWidget: (peerInfo?: PeerInfo) => void;
	closeWidget: () => void;
	setTargetPeer: (peerInfo?: PeerInfo) => void;
};

export const defaultContextValue = {
	instance: undefined,
	audioElement: undefined,
	openRoomId: undefined,
	setOpenRoomId: () => undefined,
	getAutocompleteOptions: () => Promise.resolve([]),
	currentViews: new Set<AvailableViews>(),
	registerView: () => undefined,
	unregisterView: () => undefined,
	openWidget: () => undefined,
	closeWidget: () => undefined,
	setTargetPeer: () => undefined,
	targetWidgetVisibility: 'closed' as const,
	targetPeer: undefined,
};

export const MediaCallInstanceContext = createContext<MediaCallInstanceContextValue>(defaultContextValue);

export const useMediaCallInstance = (): MediaCallInstanceContextValue => useContext(MediaCallInstanceContext);
