import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import ConferencePageError from './ConferencePageError';
import { useVideoConfOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';

/**
 * Whether this is somewhere to go, rather than something to run.
 *
 * The address arrives in a query parameter, so it is whatever the link that opened this page said — and this
 * page hands it to `window.open`. A `javascript:` or `data:` "URL" is not a location: it executes, in a window
 * we opened. Resolved against this origin, so a provider that answers with a relative address still passes —
 * refusing those would turn away calls that work today, which is a different question from this one.
 */
const isSafeCallUrl = (candidate: string): boolean => {
	try {
		const { protocol } = new URL(candidate, window.location.origin);
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
};

const getQueryParams = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const callUrlParam = urlParams.get('callUrl');

	return { callUrlParam: callUrlParam && isSafeCallUrl(callUrlParam) ? callUrlParam : null };
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

		handleOpenCall(callUrl);

		defaultRoute.push();
	}, [setModal, defaultRoute, callUrl, handleOpenCall, userDisplayName]);

	if (!callUrl) {
		return <ConferencePageError />;
	}

	return <PageLoading />;
};

export default ConferencePage;
