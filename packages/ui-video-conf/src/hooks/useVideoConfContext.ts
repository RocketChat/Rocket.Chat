import { useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { VideoConfContext } from '../VideoConfContext';

const useVideoConfContext = () => {
	const context = useContext(VideoConfContext);
	if (!context) {
		throw new Error('Must be running in VideoConf Context');
	}

	return context;
};

export const useVideoConfDispatchOutgoing = () => useVideoConfContext().dispatchOutgoing;
export const useVideoConfDismissOutgoing = () => useVideoConfContext().dismissOutgoing;
export const useVideoConfStartCall = () => useVideoConfContext().startCall;
export const useVideoConfAcceptCall = () => useVideoConfContext().acceptCall;
export const useVideoConfJoinCall = () => useVideoConfContext().joinCall;
export const useVideoConfDismissCall = () => useVideoConfContext().dismissCall;
export const useVideoConfAbortCall = () => useVideoConfContext().abortCall;
export const useVideoConfRejectIncomingCall = () => useVideoConfContext().rejectIncomingCall;
export const useVideoConfSetPreferences = () => useVideoConfContext().setPreferences;
export const useVideoConfLoadCapabilities = () => useVideoConfContext().loadCapabilities;

export const useVideoConfIncomingCalls = () => {
	const { queryIncomingCalls } = useVideoConfContext();
	return useSyncExternalStore(queryIncomingCalls.subscribe, queryIncomingCalls.getSnapshot);
};

export const useVideoConfIsRinging = () => {
	const { queryRinging } = useVideoConfContext();
	return useSyncExternalStore(queryRinging.subscribe, queryRinging.getSnapshot);
};

export const useVideoConfIsCalling = () => {
	const { queryCalling } = useVideoConfContext();
	return useSyncExternalStore(queryCalling.subscribe, queryCalling.getSnapshot);
};

export const useVideoConfCapabilities = () => {
	const { queryCapabilities } = useVideoConfContext();
	return useSyncExternalStore(queryCapabilities.subscribe, queryCapabilities.getSnapshot);
};

export const useVideoConfPreferences = () => {
	const { queryPreferences } = useVideoConfContext();
	return useSyncExternalStore(queryPreferences.subscribe, queryPreferences.getSnapshot);
};
