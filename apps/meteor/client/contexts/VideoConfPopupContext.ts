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
	dismiss: (rid: VideoConfPopupPayload['id']) => void;
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

export const VideoConfPopupContext = createContext<VideoConfPopupContextValue>({
	dispatch: () => undefined,
	dismiss: () => undefined,
	startCall: () => undefined,
	acceptCall: () => undefined,
	joinCall: () => undefined,
	dismissCall: () => undefined,
	abortCall: () => undefined,
	useIncomingCalls: () => [],
	rejectIncomingCall: () => undefined,
	setPreferences: () => undefined,
	changePreference: () => undefined,
	useIsRinging: () => false,
});

export const useVideoConfPopupDispatch = (): VideoConfPopupContextValue['dispatch'] => useContext(VideoConfPopupContext).dispatch;
export const useVideoConfPopupDismiss = (): VideoConfPopupContextValue['dismiss'] => useContext(VideoConfPopupContext).dismiss;
export const useStartCall = (): VideoConfPopupContextValue['startCall'] => useContext(VideoConfPopupContext).startCall;
export const useAcceptCall = (): VideoConfPopupContextValue['acceptCall'] => useContext(VideoConfPopupContext).acceptCall;
export const useJoinCall = (): VideoConfPopupContextValue['joinCall'] => useContext(VideoConfPopupContext).joinCall;
export const useDismissCall = (): VideoConfPopupContextValue['dismissCall'] => useContext(VideoConfPopupContext).dismissCall;
export const useAbortCall = (): VideoConfPopupContextValue['abortCall'] => useContext(VideoConfPopupContext).abortCall;
export const useRejectIncomingCall = (): VideoConfPopupContextValue['rejectIncomingCall'] =>
	useContext(VideoConfPopupContext).rejectIncomingCall;
export const useGetIncomingCalls = (): VideoConfPopupContextValue['useIncomingCalls'] => useContext(VideoConfPopupContext).useIncomingCalls;
export const useSetPreferences = (): VideoConfPopupContextValue['setPreferences'] => useContext(VideoConfPopupContext).setPreferences;
export const useChangePreference = (): VideoConfPopupContextValue['changePreference'] => useContext(VideoConfPopupContext).changePreference;
export const useGetIsRinging = (): VideoConfPopupContextValue['useIsRinging'] => useContext(VideoConfPopupContext).useIsRinging;
