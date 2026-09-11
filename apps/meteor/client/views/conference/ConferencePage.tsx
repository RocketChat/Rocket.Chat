import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import ConferencePageError from './ConferencePageError';
import { useVideoConfOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';

/**
 * Whether this is a call to open: an absolute `http(s)` address, and nothing else.
 *
 * The address arrives in a query parameter, so it is whatever the link that opened this page said — and this
 * page hands it to `window.open`. Two things have to be turned away. A `javascript:` or `data:` "URL" is not a
 * location at all: it executes, in a window we opened. And a *relative* one is not a call either — it resolves
 * against this origin, so `?callUrl=/admin/settings` would open the workspace in a call window.
 *
 * Parsed with no base, which is what makes the second one fail. Our own conference URLs are built with
 * `absoluteUrl`, so none of them is turned away; a provider that answers with a relative address reaches
 * `handleOpenCall` from the room, not from a link into this page.
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
