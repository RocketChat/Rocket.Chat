import { Box } from '@rocket.chat/fuselage';

import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);

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
			<Box width='30%' display='flex' flexDirection='column' minWidth={350} bg='tint' borderInlineEndWidth={1} borderColor='divider'>
				<ConferenceChat callId={callId} rid={room.rid} loading={room.loading} />
			</Box>

			<Box width='70%' display='flex' flexDirection='column' position='relative'>
				<ConferenceIframe url={conference.url} loading={conference.loading} />
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
