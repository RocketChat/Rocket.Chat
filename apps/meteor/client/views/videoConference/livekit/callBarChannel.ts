/**
 * Cross-window channel for the native video call bar.
 *
 * The call runs inside the pop-out /conference/:id window, whose React tree
 * owns all call state. The main app window(s) need a persistent call bar —
 * "the single in-app representation of an active call" per the Figma spec —
 * so the conference window broadcasts its state here and accepts commands
 * back. BroadcastChannel never echoes to the posting context, so the
 * conference window won't see its own state messages.
 */

export type NativeVideoCallState = {
	callId: string;
	rid: string;
	roomName: string;
	muted: boolean;
	camOn: boolean;
	sharing: boolean;
	handRaised: boolean;
	startedAt?: string;
	/** Date.now() at the publisher — used for freshness (heartbeat TTL) */
	ts: number;
};

export type NativeVideoCallCommand = 'toggleMic' | 'toggleCam' | 'toggleShare' | 'toggleHand' | 'hangup' | 'focus';

type ChannelMessage =
	| { type: 'state'; state: NativeVideoCallState }
	| { type: 'ended'; callId: string }
	| { type: 'command'; callId: string; action: NativeVideoCallCommand };

const CHANNEL_NAME = 'rocket.chat.native-video-call';

/** how often the conference window re-broadcasts state */
export const STATE_HEARTBEAT_MS = 2000;

/** state older than this is treated as gone (window crashed / closed) */
const STATE_TTL_MS = 6000;

let channel: BroadcastChannel | null = null;
let latestState: NativeVideoCallState | null = null;
let expiryTimer: ReturnType<typeof setInterval> | null = null;

const stateListeners = new Set<() => void>();
const commandListeners = new Set<(callId: string, action: NativeVideoCallCommand) => void>();

const notifyState = () => {
	stateListeners.forEach((listener) => listener());
};

const clearExpiryTimer = () => {
	if (expiryTimer) {
		clearInterval(expiryTimer);
		expiryTimer = null;
	}
};

const armExpiryTimer = () => {
	if (expiryTimer) {
		return;
	}
	expiryTimer = setInterval(() => {
		if (latestState && Date.now() - latestState.ts > STATE_TTL_MS) {
			latestState = null;
			clearExpiryTimer();
			notifyState();
		}
	}, STATE_HEARTBEAT_MS);
};

const ensureChannel = (): BroadcastChannel | null => {
	if (typeof BroadcastChannel === 'undefined') {
		return null;
	}
	if (!channel) {
		channel = new BroadcastChannel(CHANNEL_NAME);
		channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
			const message = event.data;
			if (message.type === 'state') {
				latestState = message.state;
				armExpiryTimer();
				notifyState();
				return;
			}
			if (message.type === 'ended') {
				if (latestState?.callId === message.callId) {
					latestState = null;
					clearExpiryTimer();
					notifyState();
				}
				return;
			}
			if (message.type === 'command') {
				commandListeners.forEach((listener) => listener(message.callId, message.action));
			}
		};
	}
	return channel;
};

/** Latest known state of a call running in ANOTHER window (null if none/stale). */
export const getRemoteCallState = (): NativeVideoCallState | null => {
	ensureChannel();
	if (latestState && Date.now() - latestState.ts > STATE_TTL_MS) {
		return null;
	}
	return latestState;
};

export const subscribeRemoteCallState = (listener: () => void): (() => void) => {
	ensureChannel();
	stateListeners.add(listener);
	return () => {
		stateListeners.delete(listener);
	};
};

export const publishCallState = (state: NativeVideoCallState): void => {
	ensureChannel()?.postMessage({ type: 'state', state } satisfies ChannelMessage);
};

export const publishCallEnded = (callId: string): void => {
	ensureChannel()?.postMessage({ type: 'ended', callId } satisfies ChannelMessage);
};

export const sendCallCommand = (callId: string, action: NativeVideoCallCommand): void => {
	ensureChannel()?.postMessage({ type: 'command', callId, action } satisfies ChannelMessage);
};

/** Conference-window side: react to commands sent from the main window. */
export const onCallCommand = (listener: (callId: string, action: NativeVideoCallCommand) => void): (() => void) => {
	ensureChannel();
	commandListeners.add(listener);
	return () => {
		commandListeners.delete(listener);
	};
};
