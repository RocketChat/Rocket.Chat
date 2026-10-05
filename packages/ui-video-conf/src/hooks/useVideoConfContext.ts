import { useContext, useMemo, useSyncExternalStore } from 'react';

import { VideoConfContext } from '../VideoConfContext';

const useVideoConfContext = () => {
	const context = useContext(VideoConfContext);
	if (!context) {
		throw new Error('Must be running in VideoConf Context');
	}

	return context;
};

/**
 * Whether the workspace has the call-window experience turned on.
 *
 * Read optionally, unlike its siblings: this one is asked from the navbar, the sidebar and the message blocks,
 * which render wherever the product does. Throwing there would take the page down over a setting, and the
 * answer for somewhere with no call context is the same as for a workspace with the window off.
 *
 * Not for anything `VideoConfProvider` itself calls. A component cannot read the context it provides — the
 * hooks in its own body see the parent's value — so those ask the setting directly.
 */
export const useVideoConfWindowEnabled = (): boolean => useContext(VideoConfContext)?.conferenceWindowEnabled ?? false;
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
