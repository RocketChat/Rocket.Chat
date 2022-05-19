import { IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type VideoConfPopupPayload = {
	id: string;
	room: IRoom;
};

type VideoConfPopupContextValue = {
	dispatch: (options: Omit<VideoConfPopupPayload, 'id'>) => void;
	dismiss: (rid: VideoConfPopupPayload['room']['_id']) => void;
};

export const VideoConfPopupContext = createContext<VideoConfPopupContextValue>({
	dispatch: () => undefined,
	dismiss: () => undefined,
});

export const useVideoConfPopupDispatch = (): VideoConfPopupContextValue['dispatch'] => useContext(VideoConfPopupContext).dispatch;
export const useVideoConfPopupDismiss = (): VideoConfPopupContextValue['dismiss'] => useContext(VideoConfPopupContext).dismiss;
