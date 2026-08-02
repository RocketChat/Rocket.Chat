import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ChatAccessNotice from './ChatAccessNotice';
import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { CallBar, CallBarActions, CallBarAction, CallPanel } from './components';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useProviderCallBridge } from './hooks/useProviderCallBridge';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

/**
 * Renders a conference as the call plus a bottom control bar, with the conference's persistent chat in a
 * panel that opens beside the call — above the bar, so toggling it never reflows the controls.
 */
const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);
	const { t } = useTranslation();

	// The chat panel is a full room UI, so a link/mention click would navigate this window away and tear
	// down the call. Keep this window pinned to the conference — those go to the opener or a new tab.
	useConfinedNavigation();

	// A provider rendering its own toolbar can hide our bar and drive the chat panel from its own controls.
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const { callBarVisible, chatVisible, toggleChat } = useProviderCallBridge(iframeRef);

	// On narrow viewports the panel floats over the call instead of squeezing it.
	const breakpoints = useBreakpoints();
	const overlayPanel = !breakpoints.includes('md');

	const subscription = useUserSubscription(room.rid ?? '');
	const unreadCount = chatVisible ? 0 : (subscription?.unread ?? 0);

	// No access to the conference's room — show the unauthorized screen for the whole page rather than a
	// broken split with a "not found" chat panel.
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
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
			{/* With the chat open the notice belongs in the panel, next to the conversation it is about. With it
			    closed there would be nowhere to see it, so it moves up here rather than being shown twice. */}
			{!chatVisible && <ChatAccessNotice callId={callId} memberIds={room.membersWithoutChatAccess} />}

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} display='flex' flexDirection='column' position='relative'>
					<ConferenceIframe ref={iframeRef} url={conference.url} />
				</Box>

				<CallPanel visible={chatVisible} overlay={overlayPanel}>
					<ConferenceChat
						callId={callId}
						rid={room.rid}
						loading={room.loading}
						membersWithoutChatAccess={room.membersWithoutChatAccess}
						onClose={toggleChat}
					/>
				</CallPanel>
			</Box>

			{callBarVisible && (
				<CallBar>
					<CallBarActions placement='end'>
						<CallBarAction icon='balloon' label={t('Chat')} pressed={chatVisible} badgeCount={unreadCount} onClick={toggleChat} />
					</CallBarActions>
				</CallBar>
			)}
		</Box>
	);
};

export default ConferenceEmbeddedPage;
