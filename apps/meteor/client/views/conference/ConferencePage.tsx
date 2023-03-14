import { useRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { useVideoOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';

const getQueryParams = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const callUrlParam = urlParams.get('callUrl');

	return { callUrlParam };
};

const ConferencePage = (): ReactElement => {
	const user = useUser();
	const defaultRoute = useRoute('/');
	const setModal = useSetModal();
	const handleOpenCall = useVideoOpenCall();
	const userDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	const { callUrlParam } = getQueryParams();
	const callUrl = `${callUrlParam}&name=${userDisplayName}`;

	useEffect(() => {
		if (!callUrl) {
			return defaultRoute.push();
		}

		handleOpenCall(callUrl);

		defaultRoute.push();
	}, [setModal, defaultRoute, callUrl, handleOpenCall, userDisplayName]);

	return <PageLoading />;
};

export default ConferencePage;
