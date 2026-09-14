import { useCallback, useEffect, useRef } from 'react';

/**
 * The message contract between this call window and a plugin running in the provider's own page.
 *
 * A provider reached by URL renders in this window's iframe, and its page can carry controls of its own — a
 * chat button in its in-meeting toolbar, a Leave button. Those controls know nothing about the panels beside
 * the frame unless something tells them, which is what this protocol is for: the provider's button becomes a
 * remote control for the chat panel this page owns, and this page hears about a call the user left from inside
 * the frame.
 *
 * Every message, in both directions, is `{ action: 'rocketchat:videoconf/<name>', ...payload }`. The namespace
 * is Rocket.Chat's rather than any provider's: the protocol is this window's, and any provider plugin that
 * speaks it gets the same behaviour. Pexip's `external-chat` plugin is the first to implement it.
 *
 * Unknown actions are ignored on both sides, so either half can learn a new message without breaking the other.
 *
 * | Direction | Action | Payload |
 * | --- | --- | --- |
 * | plugin → window | `ready` | — |
 * | plugin → window | `toggle-chat` | `{ active: boolean }` |
 * | plugin → window | `connected` | — |
 * | plugin → window | `disconnected` | `{ userInitiated: boolean }` |
 * | window → plugin | `chat-state` | `{ active: boolean }` |
 * | window → plugin | `chat-unread` | `{ unread: boolean }` |
 */
const PLUGIN_NS = 'rocketchat:videoconf';

type UseProviderPluginOptions = {
	/**
	 * The provider page in the iframe, and the origin its messages have to come from. Undefined for a provider
	 * that has no page of its own — nothing to talk to, and no origin to check a message against.
	 */
	conferenceUrl: string | undefined;
	/** Whether the chat panel is open, which is what the plugin's own control reflects. */
	chatVisible: boolean;
	/** Whether the chat has anything unread, which is what that control's badge reflects. */
	hasUnread: boolean;
	/** The plugin's chat control was used: open or close the chat panel. */
	onToggleChat: (active: boolean) => void;
	/**
	 * The user left the call from inside the provider's page. A provider with a page of its own keeps its own
	 * hang-up button, so this is the only way this window hears about it — see the `disconnected` case below
	 * for why only a deliberate leave gets here.
	 */
	onLeave: () => void;
};

/**
 * Keeps a provider plugin's chat control and this page's chat panel saying the same thing.
 *
 * Inert for a provider that posts none of these messages: a call that runs inside this page has no iframe at
 * all, and a provider page without a plugin never says `ready`.
 */
export const useProviderPlugin = ({ conferenceUrl, chatVisible, hasUnread, onToggleChat, onLeave }: UseProviderPluginOptions) => {
	// The plugin's own frame, learned from the messages it sends. Not the iframe this page renders: a plugin may
	// run in a frame *inside* the provider's page — Pexip's does — and a message posted to the provider's own
	// window would never reach it there. So there is nothing to say until it has said `ready`.
	const pluginWindowRef = useRef<Window | null>(null);

	// Read inside the listener, which is bound once per call rather than on every panel toggle.
	const chatVisibleRef = useRef(chatVisible);
	chatVisibleRef.current = chatVisible;
	const hasUnreadRef = useRef(hasUnread);
	hasUnreadRef.current = hasUnread;
	const onToggleChatRef = useRef(onToggleChat);
	onToggleChatRef.current = onToggleChat;
	const onLeaveRef = useRef(onLeave);
	onLeaveRef.current = onLeave;

	// `disconnected` also arrives from a provider's own prejoin screen, where nobody has joined anything yet.
	// Reporting a leave from there would end a call for everyone still on their way into it.
	const wasConnectedRef = useRef(false);

	const postToPlugin = useCallback((action: string, data: Record<string, unknown>) => {
		// A wildcard target because a plugin frame may be sandboxed, and an opaque origin is the one case a
		// concrete target origin cannot name. Nothing here is worth keeping from whoever is listening: the
		// payloads are two booleans about a panel this page is already showing.
		pluginWindowRef.current?.postMessage({ action: `${PLUGIN_NS}/${action}`, ...data }, '*');
	}, []);

	useEffect(() => {
		let expectedOrigin: string;
		try {
			expectedOrigin = conferenceUrl ? new URL(conferenceUrl).origin : '';
		} catch {
			expectedOrigin = '';
		}

		// Nothing to listen for without a provider page to attribute the messages to. Listening anyway would
		// mean acting on `toggle-chat` from whatever else can reach this window.
		if (!expectedOrigin) {
			return;
		}

		const handleMessage = (event: MessageEvent) => {
			const data = event.data as { action?: unknown; active?: unknown; userInitiated?: unknown } | null;
			if (!data || typeof data !== 'object') {
				return;
			}

			const { action } = data;
			if (typeof action !== 'string' || !action.startsWith(`${PLUGIN_NS}/`)) {
				return;
			}

			// The provider's own origin, or `null` for a sandboxed plugin frame — a sandbox without
			// `allow-same-origin` reports its origin as the opaque string rather than the document's.
			if (event.origin !== expectedOrigin && event.origin !== 'null') {
				return;
			}

			// Where to answer. Re-read from every message, so a reloaded provider page is answered in its new
			// frame rather than the one that went away with it.
			if (event.source) {
				pluginWindowRef.current = event.source as Window;
			}

			switch (action.slice(PLUGIN_NS.length + 1)) {
				case 'ready':
					// The plugin has no idea what this page is showing, and its control renders before it hears.
					// This is the one message that has to be answered, and both answers are part of it.
					postToPlugin('chat-state', { active: chatVisibleRef.current });
					postToPlugin('chat-unread', { unread: hasUnreadRef.current });
					break;

				case 'connected':
					// Past the provider's own prejoin screen and into the call, which is also when the controls
					// that speak this protocol appear.
					wasConnectedRef.current = true;
					break;

				case 'disconnected':
					// Only a deliberate leave, and only from someone who had actually joined. An involuntary
					// drop is the provider's own to recover — its page offers to reconnect, and closing this
					// window out from under that would turn a blip into a departure.
					if (wasConnectedRef.current && data.userInitiated === true) {
						wasConnectedRef.current = false;
						onLeaveRef.current();
					}
					break;

				case 'toggle-chat':
					// The provider's chat control was used. Nothing is answered here: the panel moves, and the
					// effect below reports where it ended up — the same report every other way of moving it makes.
					onToggleChatRef.current(data.active === true);
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [conferenceUrl, postToPlugin]);

	// Pushed rather than answered, so every way of opening and closing the chat keeps the provider's control
	// honest: this page's own toggle in the top bar, the panel's close button, and the provider's control itself.
	useEffect(() => {
		postToPlugin('chat-state', { active: chatVisible });
	}, [chatVisible, postToPlugin]);

	useEffect(() => {
		postToPlugin('chat-unread', { unread: hasUnread });
	}, [hasUnread, postToPlugin]);
};
