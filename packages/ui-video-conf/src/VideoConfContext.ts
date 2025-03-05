import type { IRoom, DirectCallData, ProviderCapabilities, CallPreferences } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type VideoConfPopupPayload = {
	id: string;
	rid: IRoom['_id'];
	isReceiving?: boolean;
};

export type VideoConfContextValue = {
	dispatchOutgoing: (options: Omit<VideoConfPopupPayload, 'id'>) => void;
	dismissOutgoing: () => void;
	startCall: (rid: IRoom['_id'], title?: string) => void;
	acceptCall: (callId: string) => void;
	joinCall: (callId: string) => void;
	dismissCall: (callId: string) => void;
	rejectIncomingCall: (callId: string) => void;
	abortCall: () => void;
	setPreferences: (prefs: { mic?: boolean; cam?: boolean }) => void;
	loadCapabilities: () => Promise<void>;
	queryIncomingCalls: () => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => DirectCallData[]];
	queryRinging: () => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryCalling: () => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean];
	queryCapabilities: () => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ProviderCapabilities];
	queryPreferences: () => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => CallPreferences];
};

export const VideoConfContext = createContext<VideoConfContextValue | undefined>(undefined);
