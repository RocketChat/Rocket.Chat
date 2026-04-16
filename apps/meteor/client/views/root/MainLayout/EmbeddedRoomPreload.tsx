import type { RoomType } from '@rocket.chat/core-typings';
import { useEffect, type ReactElement, type ReactNode } from 'react';

import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import { useOpenRoom } from '../../room/hooks/useOpenRoom';
import PageLoading from '../PageLoading';
import { EmbeddedRoomContext } from './EmbeddedPreload';
import { useMainReady } from '../hooks/useMainReady';

const EmbeddedRoomPreload = ({
	params,
	children,
}: {
	params: { type: RoomType; reference: string };
	children: ReactNode;
}): ReactElement => {
	const ready = useMainReady();
	const state = useOpenRoom(params);

	useEffect(() => {
		if (!state.isLoading) {
			SubscriptionsCachedStore.setReady(true);
			RoomsCachedStore.setReady(true);
		}
	}, [state.isLoading]);

	if (!ready || state.isLoading) {
		return <PageLoading />;
	}

	return <EmbeddedRoomContext.Provider value={state}>{children}</EmbeddedRoomContext.Provider>;
};

export default EmbeddedRoomPreload;
