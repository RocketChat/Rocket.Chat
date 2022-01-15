import React, { ReactElement, ReactNode } from 'react';

import { CachedChatSubscription } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { useUserId } from '../../../contexts/UserContext';
import { useReactiveVar } from '../../../hooks/useReactiveVar';
import { isSyncReady } from '../../../lib/userData';
import PageLoading from '../PageLoading';

const Preload = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const subscriptionsReady = useReactiveVar(CachedChatSubscription.ready);
	const settingsReady = useReactiveVar(settings.cachedCollection.ready);
	const userDataReady = useReactiveVar(isSyncReady);

	const ready = !uid || (userDataReady && subscriptionsReady && settingsReady);

	if (!ready) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default Preload;
