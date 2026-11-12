import { ConferenceWindow } from '@rocket.chat/ui-conference';

import ConferencePageError from './ConferencePageError';
import ConferenceProvider from './providers/ConferenceProvider';
import PageLoading from '../root/PageLoading';
import { useConferenceScheduled } from './hooks/useConferenceScheduled';

type ConferenceScheduledPageProps = {
	/** The number that was dialled, or the booking the link was handed out for. */
	id: string;
};

/** A conference reached by the number that was dialled or the booking, rather than by its id. */
const ConferenceScheduledPage = ({ id }: ConferenceScheduledPageProps) => {
	const { callId, error } = useConferenceScheduled(id);

	if (callId) {
		return (
			<ConferenceProvider callId={callId}>
				<ConferenceWindow />
			</ConferenceProvider>
		);
	}

	if (error) {
		return <ConferencePageError />;
	}

	return <PageLoading />;
};

export default ConferenceScheduledPage;
