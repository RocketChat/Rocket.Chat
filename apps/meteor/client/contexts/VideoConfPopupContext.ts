import { IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

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

type VideoConfPopupContextValue = {
	dispatch: (options: Omit<VideoConfPopupPayload, 'id'>) => void;
	startCall: (rid: IRoom['_id'], title?: string) => void;
	acceptCall: (callId: string) => void;
	joinCall: (callId: string) => void;
	dismissCall: (callId: string) => void;
	abortCall: () => void;
	useIncomingCalls: () => VideoConfIncomingCall[];
	rejectIncomingCall: (callId: string) => void;
	setPreferences: (prefs: { mic?: boolean; cam?: boolean }) => void;
	changePreference: (key: 'cam' | 'mic', value: boolean) => void;
	useIsRinging: () => boolean;
};

export const VideoConfPopupContext = createContext<VideoConfPopupContextValue | undefined>(undefined);
const useVideoContext = (): VideoConfPopupContextValue => {
	const context = useContext(VideoConfPopupContext);
	if (!context) {
		throw new Error('Must be running in VideoConf Context');
	}

	return context;
};

export const useVideoConfPopupDispatch = (): VideoConfPopupContextValue['dispatch'] => useVideoContext().dispatch;
export const useStartCall = (): VideoConfPopupContextValue['startCall'] => useVideoContext().startCall;
export const useAcceptCall = (): VideoConfPopupContextValue['acceptCall'] => useVideoContext().acceptCall;
export const useJoinCall = (): VideoConfPopupContextValue['joinCall'] => useVideoContext().joinCall;
export const useDismissCall = (): VideoConfPopupContextValue['dismissCall'] => useVideoContext().dismissCall;
export const useAbortCall = (): VideoConfPopupContextValue['abortCall'] => useVideoContext().abortCall;
export const useRejectIncomingCall = (): VideoConfPopupContextValue['rejectIncomingCall'] => useVideoContext().rejectIncomingCall;
export const useGetIncomingCalls = (): VideoConfPopupContextValue['useIncomingCalls'] => useVideoContext().useIncomingCalls;
export const useSetPreferences = (): VideoConfPopupContextValue['setPreferences'] => useVideoContext().setPreferences;
export const useChangePreference = (): VideoConfPopupContextValue['changePreference'] => useVideoContext().changePreference;
export const useGetIsRinging = (): VideoConfPopupContextValue['useIsRinging'] => useVideoContext().useIsRinging;
