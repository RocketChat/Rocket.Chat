import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ActiveLiveKitCall = {
	callId: string;
	rid: string;
	/**
	 * What the preflight chose: whether to arrive with mic and camera on, and — since this provider can be
	 * told — which devices to use. The bridge applies them as the initial capture options on connect, so the
	 * room reflects the choice instead of defaulting to "mic on, cam off, whatever device".
	 */
	preferences?: { mic?: boolean; cam?: boolean; micId?: string; camId?: string; speakerId?: string };
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

/**
 * The same slot, or `null` where no LiveKit provider is mounted.
 *
 * For the bridge in `VideoConfProvider`, which only forwards an embedded join on to whoever can serve it: with
 * no embedded provider there is nowhere to forward to, and that is the ordinary case for every URL-based
 * provider rather than a misconfiguration. LiveKit's own components use the throwing hook above — they cannot
 * work without the context, and should say so.
 */
export const useOptionalLiveKitVideoConf = (): LiveKitVideoConfContextValue | null => useContext(LiveKitVideoConfContext);
