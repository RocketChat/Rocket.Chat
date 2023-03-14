import { useRoute, useCurrentRoute, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { useVideoOpenCall } from '../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import PageLoading from '../root/PageLoading';

const ConferencePage = (): ReactElement => {
	const user = useUser();
	const defaultRoute = useRoute('/');
	const setModal = useSetModal();
	const [, , queryParams] = useCurrentRoute();
	const handleOpenCall = useVideoOpenCall();
	const userDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	const callUrl =
		queryParams?.callProvider === 'pexip' ? `${queryParams?.callUrl}&pin=${queryParams.pin}&name=${userDisplayName}` : queryParams?.callUrl;

	useEffect(() => {
		if (!callUrl) {
			return defaultRoute.push();
		}

		handleOpenCall(callUrl);

		defaultRoute.push();
	}, [setModal, defaultRoute, callUrl, handleOpenCall]);

	return <PageLoading />;
};

export default ConferencePage;
