import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { SideRail, SideRailActions, SideRailAction, SideRailPanel } from './components';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

/**
 * Renders a conference as a split view: the provider's call in an iframe, with the conference's
 * persistent chat in a collapsible panel beside it.
 */
const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);
	const { t } = useTranslation();

	// The chat panel is a full room UI, so a link/mention click would navigate this window away and tear
	// down the call. Keep this window pinned to the conference — those go to the opener or a new tab.
	useConfinedNavigation();

	// On narrow viewports the panel floats over the call instead of squeezing it.
	const breakpoints = useBreakpoints();
	const overlayPanel = !breakpoints.includes('md');

	const [chatVisible, setChatVisible] = useState(true);
	const toggleChat = () => setChatVisible((visible) => !visible);

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
		<Box display='flex' flexGrow={1} minHeight={0}>
			<SideRail>
				<SideRailActions>
					<SideRailAction icon='message' label={t('Chat')} pressed={chatVisible} onClick={toggleChat} />
				</SideRailActions>

				<SideRailPanel visible={chatVisible} overlay={overlayPanel}>
					<ConferenceChat callId={callId} rid={room.rid} loading={room.loading} onClose={toggleChat} />
				</SideRailPanel>
			</SideRail>

			<Box flexGrow={1} display='flex' flexDirection='column' position='relative'>
				<ConferenceIframe url={conference.url} />
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
