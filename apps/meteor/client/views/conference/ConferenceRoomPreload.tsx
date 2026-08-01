import type { IRoom } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { roomFields } from '../../../lib/publishFields';
import { RoomsCachedStore, SubscriptionsCachedStore } from '../../cachedStores';
import { roomsQueryKeys } from '../../lib/queryKeys';
import { mapRoomFromApi } from '../../lib/utils/mapRoomFromApi';
import { mapSubscriptionFromApi } from '../../lib/utils/mapSubscriptionFromApi';
import { Rooms } from '../../stores';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import { useMainReady } from '../root/hooks/useMainReady';

type ConferenceRoomPreloadProps = {
	rid: IRoom['_id'];
	children: ReactNode;
};

/**
 * The conference page renders a single room outside the main app layout, so the cached stores that the
 * room UI reads from are never populated by the sidebar's subscriptions. This seeds the one room and
 * subscription the chat panel needs, then marks the stores ready so the room can render.
 */
const ConferenceRoomPreload = ({ rid, children }: ConferenceRoomPreloadProps) => {
	const ready = useMainReady();
	const uid = useUserId();
	const getRoomById = useEndpoint('GET', '/v1/rooms.info');
	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');

	const {
		isPending: isLoading,
		isSuccess,
		isError,
	} = useQuery({
		queryKey: [...roomsQueryKeys.room(rid), 'conference-preload', uid ?? undefined],
		queryFn: async () => {
			// Both are keyed by the rid we already have, so there's no dependency between them — fetch
			// concurrently to keep the chat panel's loading gate to a single round trip.
			const [result, subResult] = await Promise.all([getRoomById({ roomId: rid }), getSubscription({ roomId: rid })]);
			const roomData = result.room ? mapRoomFromApi(result.room) : null;

			if (!roomData?._id) {
				return null;
			}

			const unsetKeys = getObjectKeys(roomData).filter((key) => !(key in roomFields));
			unsetKeys.forEach((key) => {
				delete roomData[key];
			});
			Rooms.state.store(roomData);

			if (subResult.subscription) {
				SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(subResult.subscription));
			}

			return { rid: roomData._id };
		},
		enabled: !!uid,
		retry: false,
	});

	useEffect(() => {
		if (isSuccess || isError) {
			SubscriptionsCachedStore.setReady(true);
			RoomsCachedStore.setReady(true);
		}
	}, [isSuccess, isError]);

	if (isError) {
		return <NotFoundPage />;
	}

	if (!ready || isLoading) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default ConferenceRoomPreload;
