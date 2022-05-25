import { IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type VideoConfPopupPayload = {
	id: string;
	room: IRoom;
};

export type VideoConfIncomingCall = {
	callId: string;
	uid: string;
	rid: string;
};

type VideoConfPopupContextValue = {
	dispatch: (options: Omit<VideoConfPopupPayload, 'id'>) => void;
	dismiss: (rid: VideoConfPopupPayload['room']['_id']) => void;
	startCall: (rid: IRoom['_id'], title?: string) => void;
	acceptCall: (callId: string) => void;
	muteCall: (callId: string) => void;
	abortCall: () => void;
	useIncomingCalls: () => VideoConfIncomingCall[];
};

export const VideoConfPopupContext = createContext<VideoConfPopupContextValue>({
	dispatch: () => undefined,
	dismiss: () => undefined,
	startCall: () => undefined,
	acceptCall: () => undefined,
	muteCall: () => undefined,
	abortCall: () => undefined,
	useIncomingCalls: () => [],
});

export const useVideoConfPopupDispatch = (): VideoConfPopupContextValue['dispatch'] => useContext(VideoConfPopupContext).dispatch;
export const useVideoConfPopupDismiss = (): VideoConfPopupContextValue['dismiss'] => useContext(VideoConfPopupContext).dismiss;
export const useStartCall = (): VideoConfPopupContextValue['startCall'] => useContext(VideoConfPopupContext).startCall;
export const useAcceptCall = (): VideoConfPopupContextValue['acceptCall'] => useContext(VideoConfPopupContext).acceptCall;
export const useMuteCall = (): VideoConfPopupContextValue['muteCall'] => useContext(VideoConfPopupContext).muteCall;
export const useAbortCall = (): VideoConfPopupContextValue['abortCall'] => useContext(VideoConfPopupContext).abortCall;
export const useGetIncomingCalls = (): VideoConfPopupContextValue['useIncomingCalls'] => useContext(VideoConfPopupContext).useIncomingCalls;
