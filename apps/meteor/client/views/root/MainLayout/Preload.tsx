import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { mainReady } from '../../../../app/ui-utils/client';
import { RoomsCachedStore, SubscriptionsCachedStore, PublicSettingsCachedStore } from '../../../cachedStores';
import { useUserDataSyncReady } from '../../../lib/userData';
import PageLoading from '../PageLoading';

const Preload = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const subscriptionsReady = SubscriptionsCachedStore.useReady();
	const settingsReady = PublicSettingsCachedStore.useReady();
	const userDataReady = useUserDataSyncReady();

	const ready = !uid || (userDataReady && subscriptionsReady && settingsReady);

	useEffect(() => {
		mainReady.set(ready);
	}, [ready]);

	useEffect(() => {
		SubscriptionsCachedStore.listen();
		RoomsCachedStore.listen();
	}, []);

	if (!ready) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default Preload;
