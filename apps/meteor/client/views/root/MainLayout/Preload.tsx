import { useUserId } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, useEffect } from 'react';

import { CachedChatSubscription } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { CachedCollectionManager } from '../../../../app/ui-cached-collection';
import { mainReady } from '../../../../app/ui-utils/client';
import { useReactiveVar } from '../../../hooks/useReactiveVar';
import { isSyncReady } from '../../../lib/userData';
import PageLoading from '../PageLoading';

const Preload = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const subscriptionsReady = useReactiveVar(CachedChatSubscription.ready);
	const settingsReady = useReactiveVar(settings.cachedCollection.ready);
	const userDataReady = useReactiveVar(isSyncReady);

	const ready = !uid || (userDataReady && subscriptionsReady && settingsReady);

	useEffect(() => {
		CachedCollectionManager.syncEnabled = ready;
		mainReady.set(ready);
	}, [ready]);

	if (!ready) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default Preload;
