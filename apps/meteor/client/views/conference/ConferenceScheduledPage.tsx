import { ConferenceWindow } from '@rocket.chat/ui-conference';

import ConferencePageError from './ConferencePageError';
import ConferenceProvider from './providers/ConferenceProvider';
import PageLoading from '../root/PageLoading';
import { useConferenceScheduled } from './hooks/useConferenceScheduled';

type ConferenceScheduledPageProps = {
	sipAlias: string;
};

/** A conference reached by the number that was dialled rather than by its id. */
const ConferenceScheduledPage = ({ sipAlias }: ConferenceScheduledPageProps) => {
	const { callId, error } = useConferenceScheduled(sipAlias);

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
