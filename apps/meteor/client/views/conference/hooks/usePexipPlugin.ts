import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Message namespace shared with Pexip's "external-chat" plugin. */
const PLUGIN_NS = 'pexip:plugin:external-chat';

type UsePexipPluginOptions = {
	conferenceUrl: string | undefined;
	hasUnread: boolean;
	chatVisible: boolean;
	onToggleChat: (active: boolean) => void;
	/** Fired when the reader drops out of the call, and only after they had joined it. */
	onDisconnected?: () => void;
};

/**
 * The bridge to Pexip's chat plugin: it draws a chat button inside the call, and this keeps the two in step.
 *
 * `connected` says whether that button is on screen, which is what lets the window drop its own rather than
 * show two. Before the reader connects and after they drop out the plugin's toolbar is gone, so it goes back.
 */
export const usePexipPlugin = ({ conferenceUrl, hasUnread, chatVisible, onToggleChat, onDisconnected }: UsePexipPluginOptions) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const pluginWindowRef = useRef<Window | null>(null);

	const [connected, setConnected] = useState(false);

	// Read inside a listener that must not be rebound every time one of them changes.
	const chatVisibleRef = useRef(chatVisible);
	chatVisibleRef.current = chatVisible;
	const hasUnreadRef = useRef(hasUnread);
	hasUnreadRef.current = hasUnread;
	const onDisconnectedRef = useRef(onDisconnected);
	onDisconnectedRef.current = onDisconnected;
	// So that dropping out only means something to someone who had got in.
	const wasConnectedRef = useRef(false);

	const postToPlugin = useCallback((action: string, data: Record<string, unknown>) => {
		pluginWindowRef.current?.postMessage({ action: `${PLUGIN_NS}/${action}`, ...data }, '*');
	}, []);

	const handleChatToggle = useCallback(
		(active: boolean) => {
			onToggleChat(active);
			postToPlugin('toggle-chat-button-state', { active });
		},
		[onToggleChat, postToPlugin],
	);

	const dialOut = useCallback(
		(destination: string) => {
			postToPlugin('dial-out', { role: 'GUEST', destination, protocol: 'auto', call_type: 'audio' });
		},
		[postToPlugin],
	);

	useEffect(() => {
		let expectedOrigin: string | undefined;
		try {
			expectedOrigin = conferenceUrl ? new URL(conferenceUrl).origin : undefined;
		} catch {
			expectedOrigin = undefined;
		}

		const handleMessage = (event: MessageEvent) => {
			const data = event.data as { action?: unknown; active?: unknown; displayName?: unknown; message?: unknown } | null;
			if (!data) {
				return;
			}
			const { action } = data;
			if (typeof action !== 'string' || !action.startsWith(`${PLUGIN_NS}/`)) {
				return;
			}

			// The plugin runs in a sandboxed sub-frame of the call, whose origin is the opaque string "null".
			if (expectedOrigin && event.origin !== expectedOrigin && event.origin !== 'null') {
				return;
			}

			if (event.source) {
				pluginWindowRef.current = event.source as Window;
			}

			switch (action.slice(PLUGIN_NS.length + 1)) {
				case 'ready':
					postToPlugin('toggle-chat-button-state', { active: chatVisibleRef.current });
					postToPlugin('toggle-chat-badge', { visible: hasUnreadRef.current });
					break;
				case 'connected':
					wasConnectedRef.current = true;
					setConnected(true);
					break;
				case 'disconnected':
					setConnected(false);
					if (wasConnectedRef.current) {
						wasConnectedRef.current = false;
						onDisconnectedRef.current?.();
					}
					break;
				case 'toggle-chat': {
					handleChatToggle(data.active === true);
					break;
				}
				case 'dial-out-success':
					dispatchToastMessage({
						type: 'success',
						message: t('Calling__roomName__', { roomName: typeof data?.displayName === 'string' ? data.displayName : '' }),
					});
					break;
				case 'dial-out-error':
					dispatchToastMessage({
						type: 'error',
						message: typeof data?.message === 'string' && data.message ? data.message : t('Error'),
					});
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [conferenceUrl, handleChatToggle, postToPlugin, dispatchToastMessage, t]);

	useEffect(() => {
		postToPlugin('toggle-chat-badge', { visible: hasUnread });
	}, [hasUnread, postToPlugin]);

	return { closeChat: () => handleChatToggle(false), dialOut, connected };
};
