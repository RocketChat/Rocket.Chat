import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import ConferencePageError from './ConferencePageError';
import { useVideoConfOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import { asCallUrl } from '../../lib/utils/asCallUrl';
import PageLoading from '../root/PageLoading';

const getQueryParams = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const callUrlParam = urlParams.get('callUrl');

	return { callUrlParam };
};

const ConferencePage = () => {
	const user = useUser();
	const defaultRoute = useRoute('home');
	const setModal = useSetModal();
	const handleOpenCall = useVideoConfOpenCall();
	const userDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	const { callUrlParam } = getQueryParams();
	const callUrl = callUrlParam && userDisplayName ? `${callUrlParam}&name=${userDisplayName}` : callUrlParam;

	useEffect(() => {
		if (!callUrl) {
			return;
		}

		// Only an address is opened; anything else is simply not opened. Either way this page has done its job
		// and sends the user home, which is what it has always done once the call is out of its hands — an error
		// screen here would be a new answer to a question that already had one.
		// The address arrives in a query parameter, so it is only as trustworthy as the link that opened this
		// page — and `asCallUrl` is the same gate the in-product path uses.
		if (asCallUrl(callUrl)) {
			handleOpenCall(callUrl);
		}

		defaultRoute.push();
	}, [setModal, defaultRoute, callUrl, handleOpenCall, userDisplayName]);

	if (!callUrl) {
		return <ConferencePageError />;
	}

	return <PageLoading />;
};

export default ConferencePage;
