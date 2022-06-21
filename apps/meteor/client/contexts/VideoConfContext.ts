import { IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';
import { Subscription, useSubscription } from 'use-subscription';

import { DirectCallParams } from '../lib/VideoConfManager';

export type VideoConfPopupPayload = {
	id: string;
	rid: IRoom['_id'];
	isReceiving?: boolean;
};

export type VideoConfIncomingCall = {
	callId: string;
	uid: string;
	rid: string;
};

type VideoConfContextValue = {
	dispatchOutgoing: (options: Omit<VideoConfPopupPayload, 'id'>) => void;
	startCall: (rid: IRoom['_id'], title?: string) => void;
	acceptCall: (callId: string) => void;
	joinCall: (callId: string) => void;
	dismissCall: (callId: string) => void;
	rejectIncomingCall: (callId: string) => void;
	abortCall: () => void;
	setPreferences: (prefs: { mic?: boolean; cam?: boolean }) => void;
	changePreference: (key: 'cam' | 'mic', value: boolean) => void;
	queryIncomingCalls: Subscription<DirectCallParams[]>;
	queryRinging: Subscription<boolean>;
};

export const VideoConfContext = createContext<VideoConfContextValue | undefined>(undefined);
const useVideoContext = (): VideoConfContextValue => {
	const context = useContext(VideoConfContext);
	if (!context) {
		throw new Error('Must be running in VideoConf Context');
	}

	return context;
};

export const useVideoConfDispatchOutgoing = (): VideoConfContextValue['dispatchOutgoing'] => useVideoContext().dispatchOutgoing;
export const useVideoConfStartCall = (): VideoConfContextValue['startCall'] => useVideoContext().startCall;
export const useVideoConfAcceptCall = (): VideoConfContextValue['acceptCall'] => useVideoContext().acceptCall;
export const useVideoConfJoinCall = (): VideoConfContextValue['joinCall'] => useVideoContext().joinCall;
export const useVideoConfDismissCall = (): VideoConfContextValue['dismissCall'] => useVideoContext().dismissCall;
export const useVideoConfAbortCall = (): VideoConfContextValue['abortCall'] => useVideoContext().abortCall;
export const useVideoConfRejectIncomingCall = (): VideoConfContextValue['rejectIncomingCall'] => useVideoContext().rejectIncomingCall;
export const useVideoConfIncomingCalls = (): DirectCallParams[] => {
	const { queryIncomingCalls } = useVideoContext();
	return useSubscription(queryIncomingCalls);
};
export const useVideoConfSetPreferences = (): VideoConfContextValue['setPreferences'] => useVideoContext().setPreferences;
export const useVideoConfChangePreference = (): VideoConfContextValue['changePreference'] => useVideoContext().changePreference;
export const useVideoConfIsRinging = (): boolean => {
	const { queryRinging } = useVideoContext();
	return useSubscription(queryRinging);
};
