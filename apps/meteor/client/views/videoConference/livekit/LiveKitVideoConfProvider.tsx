import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { MediaCallViewContext, defaultMediaCallContextValue } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import CallDiagnosticsContext from './CallDiagnosticsContext';
import { useLiveKitVideoConf } from './LiveKitVideoConfContext';
import { useLiveKitTransport } from './useLiveKitTransport';

/**
 * The room, and with it the LiveKit SDK, is fetched the first time a call is live — see `LiveKitRoomHost`.
 */
const LiveKitRoomHost = lazy(() => import('./LiveKitRoomHost'));

/**
 * App-level bridge for the LiveKit group-call connection. Always renders
 * children in the same React tree position (no remount on call start/end).
 * When a group call is active (per `useLiveKitVideoConf().activeCall`), the
 * LK Room mounts into a sibling portal and an inner bridge pushes the
 * populated MediaCallViewContext value upward via state. The result: the
 * per-room MediaCallRoomActivity (rendered with provider={null}) sees the
 * live LK context, and navigating between channels doesn't tear down LK.
 *
 * Note: this is a Video Conference feature and has zero dependency on the
 * VoIP MediaSignalingSession. Active-call state is owned by the sibling
 * LiveKitVideoConfProvider context.
 */
const LiveKitVideoConfBridge = ({ children }: { children: ReactNode }) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { activeCall, leaveCall } = useLiveKitVideoConf();
	const callId = activeCall?.callId;
	const [ctxValue, setCtxValue] = useState<unknown>(defaultMediaCallContextValue);
	const [diagnosticsValue, setDiagnosticsValue] = useState<unknown>(undefined);
	const { data: creds, error: transportError } = useLiveKitTransport(callId);
	const reportLeave = useEndpoint('POST', '/v1/video-conference.leave');

	useEffect(() => {
		if (!callId) {
			setCtxValue(defaultMediaCallContextValue);
			setDiagnosticsValue(undefined);
		}
	}, [callId]);

	// With no credentials there is no call to sit in, so the slot is released rather than left looking live.
	useEffect(() => {
		if (!transportError) {
			return;
		}
		dispatchToastMessage({ type: 'error', message: transportError });
		leaveCall();
	}, [transportError, dispatchToastMessage, leaveCall]);

	const onLeave = useCallback(() => {
		if (callId) {
			void reportLeave({ callId }).catch(() => undefined);
		}
		leaveCall();
	}, [leaveCall, callId, reportLeave]);

	// Without this the departure waits on the presence lease, and the room keeps offering the call meanwhile.
	useEffect(() => {
		if (!callId) return;
		const handler = () => void reportLeave({ callId }, { keepalive: true }).catch(() => undefined);
		window.addEventListener('pagehide', handler);
		return () => {
			window.removeEventListener('pagehide', handler);
		};
	}, [callId, reportLeave]);

	const lkActive = Boolean(callId && creds);

	// The LK Room mounts into a hidden, app-lifetime detached node so it isn't
	// part of any per-room DOM that might unmount on navigation. The React tree
	// position of children above stays untouched.
	const lkPortalTarget = useMemo(() => {
		if (typeof document === 'undefined') return null;
		const node = document.createElement('div');
		node.setAttribute('data-livekit-host', '');
		node.style.display = 'none';
		document.body.appendChild(node);
		return node;
	}, []);
	useEffect(() => {
		return () => {
			if (lkPortalTarget?.parentNode) lkPortalTarget.parentNode.removeChild(lkPortalTarget);
		};
	}, [lkPortalTarget]);

	return (
		<CallDiagnosticsContext.Provider value={diagnosticsValue as any}>
			<MediaCallViewContext.Provider value={ctxValue as any}>
				{children}
				{lkActive && creds && callId && lkPortalTarget
					? createPortal(
							// No fallback: the room renders nothing of its own — it publishes tracks and pushes state up
							// — so there is nothing to show while its module arrives, and the call UI above is already
							// waiting on the context this fills.
							<Suspense fallback={null}>
								<LiveKitRoomHost
									serverUrl={creds.serverUrl}
									token={creds.token}
									callId={callId}
									preferences={activeCall?.preferences}
									onLeave={onLeave}
									onContextChange={setCtxValue}
									onDiagnosticsChange={setDiagnosticsValue}
								/>
							</Suspense>,
							lkPortalTarget,
						)
					: null}
			</MediaCallViewContext.Provider>
		</CallDiagnosticsContext.Provider>
	);
};

export default LiveKitVideoConfBridge;
