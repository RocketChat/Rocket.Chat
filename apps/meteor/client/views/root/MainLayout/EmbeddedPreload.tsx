import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import PageLoading from '../PageLoading';
import { useMainReady } from '../hooks/useMainReady';

const EmbeddedPreload = ({ children }: { children: ReactNode }): ReactElement => {
	const ready = useMainReady();

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
