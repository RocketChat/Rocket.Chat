import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { mainReady } from '../../../../app/ui-utils/client';
import { RoomsCachedStore, SubscriptionsCachedStore, PublicSettingsCachedStore } from '../../../cachedStores';
import { useReactiveVar } from '../../../hooks/useReactiveVar';
import { isSyncReady } from '../../../lib/userData';
import PageLoading from '../PageLoading';

const Preload = ({ children }: { children: ReactNode }): ReactElement => {
	const uid = useUserId();
	const subscriptionsReady = useReactiveVar(SubscriptionsCachedStore.ready);
	const settingsReady = useReactiveVar(PublicSettingsCachedStore.ready);
	const userDataReady = useReactiveVar(isSyncReady);

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
