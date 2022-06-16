import { IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';
import { Subscription, Unsubscribe, useSubscription } from 'use-subscription';

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
	dismissOutgoing: () => void;
	startCall: (rid: IRoom['_id'], title?: string) => void;
	acceptCall: (callId: string) => void;
	joinCall: (callId: string) => void;
	dismissCall: (callId: string) => void;
	abortCall: () => void;
	rejectIncomingCall: (callId: string) => void;
	setPreferences: (prefs: { mic?: boolean; cam?: boolean }) => void;
	changePreference: (key: 'cam' | 'mic', value: boolean) => void;
	queryIncomingCalls: Subscription<DirectCallParams[]>;
	queryRinging: Subscription<boolean>;
	queryCalling: Subscription<boolean>;
};

export const VideoConfContext = createContext<VideoConfContextValue>({
	dispatchOutgoing: () => undefined,
	dismissOutgoing: () => undefined,
	startCall: () => undefined,
	acceptCall: () => undefined,
	joinCall: () => undefined,
	dismissCall: () => undefined,
	abortCall: () => undefined,
	rejectIncomingCall: () => undefined,
	setPreferences: () => undefined,
	changePreference: () => undefined,
	queryIncomingCalls: {
		getCurrentValue: (): [] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	},
	queryRinging: {
		getCurrentValue: (): boolean => false,
		subscribe: (): Unsubscribe => (): void => undefined,
	},
	queryCalling: {
		getCurrentValue: (): boolean => false,
		subscribe: (): Unsubscribe => (): void => undefined,
	},
});

export const useDispatchOutgoing = (): VideoConfContextValue['dispatchOutgoing'] => useContext(VideoConfContext).dispatchOutgoing;
export const useDismissOutgoing = (): VideoConfContextValue['dismissOutgoing'] => useContext(VideoConfContext).dismissOutgoing;
export const useStartCall = (): VideoConfContextValue['startCall'] => useContext(VideoConfContext).startCall;
export const useAcceptCall = (): VideoConfContextValue['acceptCall'] => useContext(VideoConfContext).acceptCall;
export const useJoinCall = (): VideoConfContextValue['joinCall'] => useContext(VideoConfContext).joinCall;
export const useDismissCall = (): VideoConfContextValue['dismissCall'] => useContext(VideoConfContext).dismissCall;
export const useAbortCall = (): VideoConfContextValue['abortCall'] => useContext(VideoConfContext).abortCall;
export const useRejectIncomingCall = (): VideoConfContextValue['rejectIncomingCall'] => useContext(VideoConfContext).rejectIncomingCall;
export const useSetPreferences = (): VideoConfContextValue['setPreferences'] => useContext(VideoConfContext).setPreferences;
export const useChangePreference = (): VideoConfContextValue['changePreference'] => useContext(VideoConfContext).changePreference;
export const useIncomingCalls = (): DirectCallParams[] => {
	const { queryIncomingCalls } = useContext(VideoConfContext);
	return useSubscription(queryIncomingCalls);
};
export const useIsRinging = (): boolean => {
	const { queryRinging } = useContext(VideoConfContext);
	return useSubscription(queryRinging);
};
export const useIsCalling = (): boolean => {
	const { queryCalling } = useContext(VideoConfContext);
	return useSubscription(queryCalling);
};
