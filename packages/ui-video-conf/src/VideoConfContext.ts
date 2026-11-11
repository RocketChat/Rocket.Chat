import type { IRoom, DirectCallData, ProviderCapabilities, CallPreferences } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type VideoConfPopupPayload = {
	id: string;
	rid: IRoom['_id'];
	isReceiving?: boolean;
};

export type VideoConfContextValue = {
	/**
	 * Whether joining or starting a call is off the table here.
	 *
	 * True in the call window, which renders the room's message list beside the call it is already in — where
	 * "Join" and "Call back" would start a second one. Stated by whoever provides this context, because the
	 * circumstance is the application's to recognise: a component that worked it out for itself would have to
	 * know what a call window's address looks like.
	 */
	joinDisabled?: boolean;
	/**
	 * Whether this workspace has the call-window experience turned on. Read once where this context is built,
	 * so the sites that change with it agree on the answer instead of each reading the setting for itself.
	 */
	conferenceWindowEnabled: boolean;
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
