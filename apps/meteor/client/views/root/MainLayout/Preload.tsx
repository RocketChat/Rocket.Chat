import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import PageLoading from '../PageLoading';
import { useMainReady } from '../hooks/useMainReady';

export type PreloadProps = { children: ReactNode };

const Preload = ({ children }: PreloadProps) => {
	const ready = useMainReady();

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
