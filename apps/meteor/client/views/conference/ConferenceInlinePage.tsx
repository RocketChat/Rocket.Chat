import { Box } from '@rocket.chat/fuselage';

import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';

type ConferenceInlinePageProps = {
	callId: string;
};

const ConferenceInlinePage = ({ callId }: ConferenceInlinePageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);

	return (
		<Box bg='surface-light' width='full' height='full' display='flex'>
			<Box width='30%' display='flex' flexDirection='column' minWidth={300} p={4} bg='tint' borderInlineEndWidth={1} borderColor='divider'>
				<ConferenceChat type={room.type} reference={room.reference} loading={room.loading} />
			</Box>

			<Box width='70%' margin={24} borderColor='divider' borderWidth={1}>
				<ConferenceIframe url={conference.url} loading={conference.loading} />
			</Box>
		</Box>
	);
};

export default ConferenceInlinePage;
