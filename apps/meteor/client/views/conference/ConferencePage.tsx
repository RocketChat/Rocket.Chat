import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import ConferencePageError from './ConferencePageError';
import { useVideoConfOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';

/**
 * Whether this is a call to open: an absolute `http(s)` address, and nothing else.
 *
 * The address arrives in a query parameter and is handed to `window.open`, so it is only as trustworthy as the
 * link that opened this page. Parsed with no base, which turns away a relative address — it would resolve
 * against this origin — as well as a `javascript:` or `data:` one, which is not a location but something to run
 * in a window we opened.
 */
const isCallUrl = (candidate: string): boolean => {
	try {
		const { protocol } = new URL(candidate);
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
};

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
		if (isCallUrl(callUrl)) {
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
