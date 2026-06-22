import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Message contract shared with the Pexip "external-chat" plugin. The plugin runs in a sandboxed
// sub-frame and talks to this page (its `window.top`); we talk back via the message `source`.
const PLUGIN_NS = 'pexip:plugin:external-chat';

type UsePexipPluginOptions = {
	conferenceUrl: string | undefined;
	hasUnread: boolean;
	chatVisible: boolean;
	onToggleChat: (active: boolean) => void;
};

export const usePexipPlugin = ({ conferenceUrl, hasUnread, chatVisible, onToggleChat }: UsePexipPluginOptions) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const pluginWindowRef = useRef<Window | null>(null);

	// Latest values read from inside the (rarely re-bound) message listener without re-subscribing.
	const chatVisibleRef = useRef(chatVisible);
	chatVisibleRef.current = chatVisible;
	const hasUnreadRef = useRef(hasUnread);
	hasUnreadRef.current = hasUnread;

	const postToPlugin = useCallback((action: string, data: Record<string, unknown>) => {
		pluginWindowRef.current?.postMessage({ action: `${PLUGIN_NS}/${action}`, ...data }, '*');
	}, []);

	// Closing the chat from its own header must also flip the plugin's button to inactive.
	const handleChatToggle = useCallback(
		(active: boolean) => {
			onToggleChat(active);
			postToPlugin('toggle-chat-button-state', { active });
		},
		[onToggleChat, postToPlugin],
	);

	// Dial a phone number / SIP destination into the conference via the Pexip plugin.
	const dialOut = useCallback(
		(destination: string) => {
			postToPlugin('dial-out', { role: 'GUEST', destination, protocol: 'sip', call_type: 'audio' });
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

			// Only trust the conference (Pexip) iframe's origin when we can determine it. The plugin runs
			// in a sandboxed sub-frame whose origin is opaque ("null"), so accept that too.
			if (expectedOrigin && event.origin !== expectedOrigin && event.origin !== 'null') {
				return;
			}

			// Remember the plugin frame so we can push button/badge state back to it.
			if (event.source) {
				pluginWindowRef.current = event.source as Window;
			}

			switch (action.slice(PLUGIN_NS.length + 1)) {
				case 'ready':
					// Plugin just loaded — sync it to the parent's current state.
					postToPlugin('toggle-chat-button-state', { active: chatVisibleRef.current });
					postToPlugin('toggle-chat-badge', { visible: hasUnreadRef.current });
					break;
				case 'toggle-chat': {
					const active = data.active === true;
					handleChatToggle(active);
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

	// Keep the plugin's unread badge in sync as the discussion's unread count changes.
	useEffect(() => {
		postToPlugin('toggle-chat-badge', { visible: hasUnread });
	}, [hasUnread, postToPlugin]);

	return { closeChat: () => handleChatToggle(false), dialOut };
};
