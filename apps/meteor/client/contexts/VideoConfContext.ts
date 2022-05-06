import { createContext, useContext, ReactNode } from 'react';

type VideoConfPayload = {
	// type: 'success' | 'info' | 'warning' | 'error';
	// message: string | Error;
	// title?: string;
	// options?: object;
};

type VideoConfContextValue = {
	dispatch: (popup: ReactNode) => void;
};

export const VideoConfContext = createContext<VideoConfContextValue>({
	dispatch: () => undefined,
});

export const useVideoConfCall = (): VideoConfContextValue['dispatch'] => useContext(VideoConfContext).dispatch;
