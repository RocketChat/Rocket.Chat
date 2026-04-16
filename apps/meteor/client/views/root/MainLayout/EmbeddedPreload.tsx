import { createContext, useContext, useEffect, type ReactElement, type ReactNode } from 'react';

import EmbeddedRoomPreload from './EmbeddedRoomPreload';
import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import type { useOpenRoom } from '../../room/hooks/useOpenRoom';
import { useOpenRoomParams } from '../../room/hooks/useOpenRoomParams';
import PageLoading from '../PageLoading';
import { useMainReady } from '../hooks/useMainReady';

type EmbeddedRoomState = ReturnType<typeof useOpenRoom>;

export const EmbeddedRoomContext = createContext<EmbeddedRoomState | null>(null);

export const useEmbeddedRoomState = (): EmbeddedRoomState => {
	const ctx = useContext(EmbeddedRoomContext);
	if (!ctx) {
		throw new Error('useEmbeddedRoomState must be used inside EmbeddedPreload');
	}
	return ctx;
};

const EmbeddedPreload = ({ children }: { children: ReactNode }): ReactElement => {
	const ready = useMainReady();
	const params = useOpenRoomParams();

	useEffect(() => {
		if (!params) {
			SubscriptionsCachedStore.setReady(true);
			RoomsCachedStore.setReady(true);
		}
	}, [params]);

	if (params) {
		return <EmbeddedRoomPreload params={params}>{children}</EmbeddedRoomPreload>;
	}

	if (!ready) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default EmbeddedPreload;
