import { Box } from '@rocket.chat/fuselage';

import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);

	// No access to the conference's room — show the unauthorized screen for the whole page rather
	// than a broken split with a "not found" chat panel.
	if (room.unauthorized) {
		return <ConferenceUnauthorizedPage />;
	}

	return (
		<Box bg='surface-light' width='full' height='full' display='flex'>
			<Box width='30%' display='flex' flexDirection='column' minWidth={350} bg='tint' borderInlineEndWidth={1} borderColor='divider'>
				<ConferenceChat callId={callId} rid={room.rid} loading={room.loading} />
			</Box>

			<Box width='70%' display='flex' flexDirection='column'>
				<ConferenceIframe url={conference.url} loading={conference.loading} />
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
