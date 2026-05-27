import { getObjectKeys } from '@rocket.chat/tools';
import { useEndpoint, useMethod, useRouter, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { roomFields } from '../../../../lib/publishFields';
import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { mapSubscriptionFromApi } from '../../../lib/utils/mapSubscriptionFromApi';
import { Rooms } from '../../../stores';
import PageLoading from '../PageLoading';
import { useMainReady } from '../hooks/useMainReady';

const EmbeddedPreload = ({ children }: { children: ReactNode }): ReactElement => {
	const ready = useMainReady();
	const router = useRouter();
	const uid = useUserId();

	const roomParams = useMemo(() => {
		const routeName = router.getRouteName();
		if (!routeName) {
			return null;
		}

		const identifier = roomCoordinator.getRouteNameIdentifier(routeName);
		if (!identifier) {
			return null;
		}

		const directives = roomCoordinator.getRoomDirectives(identifier);
		if (!directives?.extractOpenRoomParams) {
			return null;
		}

		return directives.extractOpenRoomParams(router.getRouteParameters());
	}, [router]);

	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');

	const shouldFetch = !!roomParams && !!uid;

	const { isLoading, isSuccess, isError } = useQuery({
		queryKey: roomParams ? roomsQueryKeys.roomReference(roomParams.reference, roomParams.type, uid ?? undefined) : [],
		queryFn: async () => {
			if (!roomParams) {
				return null;
			}

			const roomData = await getRoomByTypeAndName(roomParams.type, roomParams.reference);
			if (!roomData?._id) {
				return null;
			}

			// Populate Rooms store and return same shape as useOpenRoom so the shared
			// React Query cache entry is usable when RoomOpenerEmbedded mounts.
			const unsetKeys = getObjectKeys(roomData).filter((key) => !(key in roomFields));
			unsetKeys.forEach((key) => {
				delete roomData[key];
			});
			Rooms.state.store(roomData);

			const subResult = await getSubscription({ roomId: roomData._id });
			if (subResult.subscription) {
				SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(subResult.subscription));
			}

			return { rid: roomData._id };
		},
		enabled: shouldFetch,
		retry: false,
	});

	useEffect(() => {
		if (!shouldFetch || isSuccess || isError) {
			SubscriptionsCachedStore.setReady(true);
			RoomsCachedStore.setReady(true);
		}
	}, [shouldFetch, isSuccess, isError]);

	if (!ready || (shouldFetch && isLoading)) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default EmbeddedPreload;
