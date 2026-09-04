import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { MediaCallViewContext, defaultMediaCallContextValue } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import CallDiagnosticsContext from './CallDiagnosticsContext';
import { useLiveKitVideoConf } from './LiveKitVideoConfContext';

/**
 * The room, and with it the LiveKit SDK, is fetched the first time a call is live — see `LiveKitRoomHost`.
 */
const LiveKitRoomHost = lazy(() => import('./LiveKitRoomHost'));

const headersOf = () => ({
	'X-Auth-Token': localStorage.getItem('Meteor.loginToken') || '',
	'X-User-Id': localStorage.getItem('Meteor.userId') || '',
});

type LKCreds = { serverUrl: string; token: string; roomName: string };

/**
 * Throws rather than returning null when the credentials are refused, because the two mean opposite things to
 * whoever is waiting: no credentials *yet* is a call still connecting, while credentials refused is a call that
 * will never connect. Swallowing the difference produced the worst possible screen — the call apparently running,
 * the user alone in it, and every control inert — with nothing anywhere to say why.
 */
const fetchTransportConfig = async (callId: string): Promise<LKCreds | null> => {
	const res = await fetch(`/api/v1/video-conference.livekit.transport.config?callId=${encodeURIComponent(callId)}`, {
		headers: headersOf(),
	});
	if (!res.ok) {
		throw new Error(`transport config refused with ${res.status}`);
	}
	const data = (await res.json()) as { service: string; livekit?: LKCreds };
	return data.service === 'livekit' && data.livekit ? data.livekit : null;
};

/**
 * Tell the server the user has left this call — the same endpoint every provider reports a departure to, because
 * who is in a call is the roster's business rather than the media server's.
 *
 * Best-effort: it is idempotent, and a lost one is survivable by design. Leaving is really inferred from the
 * heartbeat stopping, so this only makes an immediate departure immediate rather than a lease's worth of wait.
 *
 * `keepalive` lets this complete after a page-unload tear-down (when the user
 * closes the tab); inside the running app a normal fetch is fine.
 */
const requestLeaveGroup = (callId: string, opts?: { keepalive?: boolean }) => {
	try {
		void fetch('/api/v1/video-conference.leave', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...headersOf() },
			body: JSON.stringify({ callId }),
			keepalive: opts?.keepalive,
		}).catch(() => undefined);
	} catch {
		/* unload-time errors are not actionable */
	}
};

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
	const [creds, setCreds] = useState<LKCreds | null>(null);
	const [ctxValue, setCtxValue] = useState<unknown>(defaultMediaCallContextValue);
	const [diagnosticsValue, setDiagnosticsValue] = useState<unknown>(undefined);

	useEffect(() => {
		if (!callId) {
			setCreds(null);
			setCtxValue(defaultMediaCallContextValue);
			setDiagnosticsValue(undefined);
			return;
		}
		let cancelled = false;
		void fetchTransportConfig(callId)
			.then((c) => {
				if (!cancelled) setCreds(c);
			})
			// Nothing to connect to, so there is no call to sit in. Leaving says so — where staying would show a
			// call that looks live and answers nothing — and the toast is what names the reason.
			.catch((error) => {
				if (cancelled) {
					return;
				}
				dispatchToastMessage({ type: 'error', message: error });
				leaveCall();
			});
		return () => {
			cancelled = true;
		};
	}, [callId, dispatchToastMessage, leaveCall]);

	const onLeave = useCallback(() => {
		if (callId) {
			requestLeaveGroup(callId);
		}
		leaveCall();
	}, [leaveCall, callId]);

	// Tab close / refresh / browser kill: fire the leave REST with keepalive so the server marks this user gone
	// before the connection dies. Without it the departure waits on the presence lease expiring, and the room
	// header goes on offering the call to everyone else in the meantime.
	useEffect(() => {
		if (!callId) return;
		const handler = () => requestLeaveGroup(callId, { keepalive: true });
		window.addEventListener('pagehide', handler);
		return () => {
			window.removeEventListener('pagehide', handler);
		};
	}, [callId]);

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

	const swm = (ctxValue as any).speakingWhileMuted === true;
	const [showSwm, setShowSwm] = useState(false);
	const swmTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const [swmRect, setSwmRect] = useState<{ left: number; bottom: number } | null>(null);

	useEffect(() => {
		if (swm) {
			if (swmTimer.current) clearTimeout(swmTimer.current);
			setShowSwm(true);
		} else if (showSwm) {
			swmTimer.current = setTimeout(() => setShowSwm(false), 3000);
		}
		return () => {
			if (swmTimer.current) clearTimeout(swmTimer.current);
		};
	}, [swm, showSwm]);

	useEffect(() => {
		if (!showSwm) {
			setSwmRect(null);
			return undefined;
		}
		const locate = () => {
			const btn = document.querySelector<HTMLElement>('[title="Unmute"], [title*="muted" i]');
			if (btn) {
				const r = btn.getBoundingClientRect();
				setSwmRect({ left: r.left + r.width / 2, bottom: window.innerHeight - r.top + 8 });
			}
		};
		locate();
		const id = setInterval(locate, 1000);
		return () => clearInterval(id);
	}, [showSwm]);

	return (
		<CallDiagnosticsContext.Provider value={diagnosticsValue as any}>
			<MediaCallViewContext.Provider value={ctxValue as any}>
				{children}
				{showSwm && swmRect && (
					<button
						type='button'
						style={{
							position: 'fixed',
							bottom: swmRect.bottom,
							left: swmRect.left,
							transform: 'translateX(-50%)',
							padding: '6px 12px',
							borderRadius: 4,
							border: 'none',
							background: 'rgba(235, 50, 50, 0.95)',
							color: '#fff',
							fontSize: 12,
							fontWeight: 500,
							lineHeight: 1.3,
							whiteSpace: 'nowrap' as const,
							zIndex: 99999,
							pointerEvents: 'auto' as const,
							cursor: 'pointer',
						}}
						onClick={(ctxValue as any).onMute}
					>
						You are muted — click to unmute
					</button>
				)}
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
