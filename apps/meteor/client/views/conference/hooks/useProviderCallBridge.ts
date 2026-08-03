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

/** The side panel currently showing, or `undefined` for none. Only one at a time — they share the same space. */
export type ConferencePanel = 'members' | 'chat';

/**
 * Owns the conference chrome state — whether our call bar is shown and which side panel is open — so both our
 * own controls and the embedded provider drive one source of truth.
 *
 * The members list opens by default: on arriving in a call the useful question is who else is here, and for the
 * caller of a call still ringing it is the only place that answers it.
 *
 * The iframe is cross-origin, so `event.origin` can't be allow-listed against our own origin. Instead each
 * message must have come from the very window we embedded, which no other frame or tab can forge.
 * Anything else is ignored.
 */
export const useProviderCallBridge = (iframeRef: RefObject<HTMLIFrameElement | null>) => {
	const [callBarVisible, setCallBarVisible] = useState(true);
	const [activePanel, setActivePanel] = useState<ConferencePanel | undefined>('members');

	const togglePanel = useCallback((panel: ConferencePanel) => setActivePanel((current) => (current === panel ? undefined : panel)), []);

	// The provider's chat commands predate there being more than one panel, so they act on the chat and leave
	// any other panel alone rather than closing whatever happens to be open.
	const setChatVisible = useCallback((visible: boolean) => {
		if (visible) {
			setActivePanel('chat');
			return;
		}

		setActivePanel((current) => (current === 'chat' ? undefined : current));
	}, []);

	const toggleChat = useCallback(() => togglePanel('chat'), [togglePanel]);

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
	}, [iframeRef, toggleChat, setChatVisible]);

	return { callBarVisible, activePanel, togglePanel };
};
