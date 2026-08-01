import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';

/** Message `type` a provider embedded in the conference iframe posts to the parent window. */
export const CONFERENCE_PROVIDER_MESSAGE = 'rocketchat:conference';

/**
 * Commands the embedded provider may send. A provider that renders its own in-call toolbar can hide ours
 * and drive the chat panel from its own controls, so the user never sees two competing sets of buttons.
 */
export type ConferenceProviderCommand =
	| { command: 'set-call-bar-visible'; visible: boolean }
	| { command: 'set-chat-visible'; visible: boolean }
	| { command: 'toggle-chat' };

type ConferenceProviderMessage = ConferenceProviderCommand & { type: typeof CONFERENCE_PROVIDER_MESSAGE };

const isProviderMessage = (data: unknown): data is ConferenceProviderMessage => {
	if (typeof data !== 'object' || data === null) {
		return false;
	}

	const message = data as { type?: unknown; command?: unknown; visible?: unknown };
	if (message.type !== CONFERENCE_PROVIDER_MESSAGE) {
		return false;
	}

	switch (message.command) {
		case 'set-call-bar-visible':
		case 'set-chat-visible':
			return typeof message.visible === 'boolean';
		case 'toggle-chat':
			return true;
		default:
			return false;
	}
};

/**
 * Owns the conference chrome state — whether our call bar and chat panel are shown — so both our own
 * controls and the embedded provider drive one source of truth.
 *
 * The iframe is cross-origin, so `event.origin` can't be allow-listed against our own origin. Instead each
 * message must have come from the very window we embedded, which no other frame or tab can forge.
 * Anything else is ignored.
 */
export const useProviderCallBridge = (iframeRef: RefObject<HTMLIFrameElement | null>) => {
	const [callBarVisible, setCallBarVisible] = useState(true);
	const [chatVisible, setChatVisible] = useState(true);

	const toggleChat = useCallback(() => setChatVisible((visible) => !visible), []);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const contentWindow = iframeRef.current?.contentWindow;
			if (!contentWindow || event.source !== contentWindow) {
				return;
			}

			if (!isProviderMessage(event.data)) {
				return;
			}

			switch (event.data.command) {
				case 'set-call-bar-visible':
					setCallBarVisible(event.data.visible);
					break;
				case 'set-chat-visible':
					setChatVisible(event.data.visible);
					break;
				case 'toggle-chat':
					toggleChat();
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [iframeRef, toggleChat]);

	return { callBarVisible, chatVisible, toggleChat };
};
