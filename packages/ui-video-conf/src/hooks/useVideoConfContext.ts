import { useContext, useMemo, useSyncExternalStore } from 'react';

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

	const [subscribe, getSnapshot] = useMemo(() => queryIncomingCalls(), [queryIncomingCalls]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useVideoConfIsRinging = () => {
	const { queryRinging } = useVideoConfContext();

	const [subscribe, getSnapshot] = useMemo(() => queryRinging(), [queryRinging]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useVideoConfIsCalling = () => {
	const { queryCalling } = useVideoConfContext();

	const [subscribe, getSnapshot] = useMemo(() => queryCalling(), [queryCalling]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useVideoConfCapabilities = () => {
	const { queryCapabilities } = useVideoConfContext();

	const [subscribe, getSnapshot] = useMemo(() => queryCapabilities(), [queryCapabilities]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useVideoConfPreferences = () => {
	const { queryPreferences } = useVideoConfContext();

	const [subscribe, getSnapshot] = useMemo(() => queryPreferences(), [queryPreferences]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
