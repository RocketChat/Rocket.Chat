import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { mainReady } from '../../../../app/ui-utils/client';
import { RoomsCachedStore, SubscriptionsCachedStore, PublicSettingsCachedStore } from '../../../cachedStores';
import { useReactiveVar } from '../../../hooks/useReactiveVar';
import { isSyncReady } from '../../../lib/userData';
import PageLoading from '../PageLoading';

const EmbeddedPreload = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const subscriptionsReady = SubscriptionsCachedStore.useReady();
	const settingsReady = PublicSettingsCachedStore.useReady();
	const userDataReady = useReactiveVar(isSyncReady);

	const ready = !uid || (userDataReady && subscriptionsReady && settingsReady);

	useEffect(() => {
		mainReady.set(ready);
	}, [ready]);

	useEffect(() => {
		SubscriptionsCachedStore.setReady(true);
		RoomsCachedStore.setReady(true);
	}, [ready]);

	if (!ready) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default EmbeddedPreload;
