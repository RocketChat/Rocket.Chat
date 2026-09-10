import { useRoute, useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useVideoConfOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';
import { useConferenceCallUrl } from './hooks/useConferenceCallUrl';

type ConferenceRedirectPageProps = {
	callUrl: string;
};

const ConferenceRedirectPage = ({ callUrl: baseCallUrl }: ConferenceRedirectPageProps) => {
	const defaultRoute = useRoute('home');
	const setModal = useSetModal();
	const handleOpenCall = useVideoConfOpenCall();
	const getConferenceCallUrl = useConferenceCallUrl();

	useEffect(() => {
		if (!baseCallUrl) {
			return;
		}

		const callUrl = getConferenceCallUrl(baseCallUrl);
		handleOpenCall(callUrl);

		defaultRoute.push();
	}, [setModal, defaultRoute, baseCallUrl, handleOpenCall, getConferenceCallUrl]);

	return <PageLoading />;
};

export default ConferenceRedirectPage;
