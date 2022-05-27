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
	muteCall: (callId: string) => void;
	abortCall: () => void;
	useIncomingCalls: () => VideoConfIncomingCall[];
	rejectIncomingCall: (callId: string) => void;
};

export const VideoConfPopupContext = createContext<VideoConfPopupContextValue>({
	dispatch: () => undefined,
	dismiss: () => undefined,
	startCall: () => undefined,
	acceptCall: () => undefined,
	joinCall: () => undefined,
	muteCall: () => undefined,
	abortCall: () => undefined,
	useIncomingCalls: () => [],
	rejectIncomingCall: () => undefined,
});

export const useVideoConfPopupDispatch = (): VideoConfPopupContextValue['dispatch'] => useContext(VideoConfPopupContext).dispatch;
export const useVideoConfPopupDismiss = (): VideoConfPopupContextValue['dismiss'] => useContext(VideoConfPopupContext).dismiss;
export const useStartCall = (): VideoConfPopupContextValue['startCall'] => useContext(VideoConfPopupContext).startCall;
export const useAcceptCall = (): VideoConfPopupContextValue['acceptCall'] => useContext(VideoConfPopupContext).acceptCall;
export const useJoinCall = (): VideoConfPopupContextValue['joinCall'] => useContext(VideoConfPopupContext).joinCall;
export const useMuteCall = (): VideoConfPopupContextValue['muteCall'] => useContext(VideoConfPopupContext).muteCall;
export const useAbortCall = (): VideoConfPopupContextValue['abortCall'] => useContext(VideoConfPopupContext).abortCall;
export const useRejectIncomingCall = (): VideoConfPopupContextValue['rejectIncomingCall'] =>
	useContext(VideoConfPopupContext).rejectIncomingCall;
export const useGetIncomingCalls = (): VideoConfPopupContextValue['useIncomingCalls'] => useContext(VideoConfPopupContext).useIncomingCalls;
