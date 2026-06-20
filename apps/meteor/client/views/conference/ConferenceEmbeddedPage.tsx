import { Box } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

// Message contract shared with the Pexip "external-chat" plugin. The plugin runs in a sandboxed
// sub-frame and talks to this page (its `window.top`); we talk back via the message `source`.
const PLUGIN_NS = 'pexip:plugin:external-chat';

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { room, conference } = useConferenceEmbedded(callId);

	// The chat starts open; the Pexip plugin's chat button mirrors/toggles this.
	const [chatVisible, setChatVisible] = useState(true);

	// The plugin frame that last messaged us — used to send button/badge/dial-out requests back to it.
	const pluginWindowRef = useRef<Window | null>(null);

	const conferenceUrl = conference.url;

	// Unread badge: reflect the discussion room's unread count on the plugin's chat button.
	const subscription = useUserSubscription(room.rid ?? '');
	const hasUnread = Boolean(subscription && subscription.unread > 0);

	// Latest values read from inside the (rarely re-bound) message listener without re-subscribing.
	const chatVisibleRef = useRef(chatVisible);
	chatVisibleRef.current = chatVisible;
	const hasUnreadRef = useRef(hasUnread);
	hasUnreadRef.current = hasUnread;

	const postToPlugin = useCallback((action: string, data: Record<string, unknown>) => {
		pluginWindowRef.current?.postMessage({ action: `${PLUGIN_NS}/${action}`, ...data }, '*');
	}, []);

	// Closing the chat from its own header must also flip the plugin's button to inactive.
	const closeChat = useCallback(() => {
		setChatVisible(false);
		postToPlugin('toggle-chat-button-state', { active: false });
	}, [postToPlugin]);

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
			const action = data?.action;
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
					setChatVisible(active);
					postToPlugin('toggle-chat-button-state', { active });
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
	}, [conferenceUrl, postToPlugin, dispatchToastMessage, t]);

	// Keep the plugin's unread badge in sync as the discussion's unread count changes.
	useEffect(() => {
		postToPlugin('toggle-chat-badge', { visible: hasUnread });
	}, [hasUnread, postToPlugin]);

	// No access to the conference's room — show the unauthorized screen for the whole page rather
	// than a broken split with a "not found" chat panel.
	if (room.error) {
		return <ConferenceUnauthorizedPage />;
	}

	if (conference.loading) {
		return <PageLoading />;
	}

	if (conference.error || !conference.url) {
		return <ConferencePageError />;
	}

	return (
		<Box bg='surface-light' width='full' height='full' display='flex'>
			{/* Keep the chat mounted while hidden so its room/composer state survives toggling. */}
			<Box
				width='30%'
				display={chatVisible ? 'flex' : 'none'}
				flexDirection='column'
				minWidth={350}
				bg='tint'
				borderInlineEndWidth={1}
				borderColor='divider'
			>
				<ConferenceChat callId={callId} rid={room.rid} loading={room.loading} onClose={closeChat} onDialOut={dialOut} />
			</Box>

			<Box width={chatVisible ? '70%' : 'full'} display='flex' flexDirection='column' position='relative'>
				<ConferenceIframe url={conference.url} loading={conference.loading} />
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
