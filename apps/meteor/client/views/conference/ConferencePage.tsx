import { useRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { useVideoConfOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';
import ConferencePageError from './ConferencePageError';

const getQueryParams = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const callUrlParam = urlParams.get('callUrl');

	return { callUrlParam };
};

const ConferencePage = (): ReactElement => {
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
