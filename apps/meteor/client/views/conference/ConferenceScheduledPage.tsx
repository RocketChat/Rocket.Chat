import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePageError from './ConferencePageError';
import PageLoading from '../root/PageLoading';
import { useConferenceScheduled } from './hooks/useConferenceScheduled';

type ConferenceScheduledPageProps = {
	sipAlias: string;
};

const ConferenceScheduledPage = ({ sipAlias }: ConferenceScheduledPageProps) => {
	const { callId, error } = useConferenceScheduled(sipAlias);

	if (callId) {
		return <ConferenceEmbeddedPage callId={callId} />;
	}

	if (error) {
		return <ConferencePageError />;
	}

	return <PageLoading />;
};

export default ConferenceScheduledPage;
