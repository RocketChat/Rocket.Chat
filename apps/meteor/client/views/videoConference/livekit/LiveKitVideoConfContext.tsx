import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ActiveLiveKitCall = {
	callId: string;
	rid: string;
	/**
	 * Preflight preferences from the start-call popup (mic/cam toggle
	 * state). The LK bridge applies these as the initial track state on
	 * connect so the room reflects the user's choice instead of always
	 * defaulting to "mic on, cam off".
	 */
	preferences?: { mic?: boolean; cam?: boolean };
};

type LiveKitVideoConfContextValue = {
	activeCall: ActiveLiveKitCall | null;
	joinCall: (call: ActiveLiveKitCall) => void;
	leaveCall: () => void;
};

const LiveKitVideoConfContext = createContext<LiveKitVideoConfContextValue | null>(null);

/**
 * App-level provider for the currently-joined LiveKit video conference.
 * Sibling to the VoIP MediaCallProvider — LK calls are a Video Conference
 * feature now and do not share state with VoIP.
 *
 * Single active call slot (matches the VoIP-era contract that the user can
 * only be in one call at a time). joinCall replaces whatever's there.
 */
export const LiveKitVideoConfProvider = ({ children }: { children: ReactNode }) => {
	const [activeCall, setActiveCall] = useState<ActiveLiveKitCall | null>(null);
	const joinCall = useCallback((call: ActiveLiveKitCall) => setActiveCall(call), []);
	const leaveCall = useCallback(() => setActiveCall(null), []);
	const value = useMemo(() => ({ activeCall, joinCall, leaveCall }), [activeCall, joinCall, leaveCall]);
	return <LiveKitVideoConfContext.Provider value={value}>{children}</LiveKitVideoConfContext.Provider>;
};

export const useLiveKitVideoConf = (): LiveKitVideoConfContextValue => {
	const ctx = useContext(LiveKitVideoConfContext);
	if (!ctx) throw new Error('useLiveKitVideoConf must be used within LiveKitVideoConfProvider');
	return ctx;
};
