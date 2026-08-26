import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { RoomsCachedStore, SubscriptionsCachedStore } from '../../cachedStores';
import PageLoading from '../root/PageLoading';
import { useMainReady } from '../root/hooks/useMainReady';

/**
 * Lets a room render outside the main app layout.
 *
 * The room UI waits on the cached stores being *ready* — a flag the sidebar's subscriptions normally set once
 * they have loaded. Nothing loads them here, and nothing needs to: the room the chat panel shows is the one room
 * in play, and `useOpenRoomById` fetches it and its subscription itself. So this only says the stores are as
 * loaded as they are going to get, which is what unblocks the room.
 *
 * It used to fetch that room here as well, which meant two `rooms.info` for the same room a moment apart.
 */
const ConferenceStoresReady = ({ children }: { children: ReactNode }) => {
	const ready = useMainReady();

	useEffect(() => {
		SubscriptionsCachedStore.setReady(true);
		RoomsCachedStore.setReady(true);
	}, []);

	if (!ready) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default ConferenceStoresReady;
