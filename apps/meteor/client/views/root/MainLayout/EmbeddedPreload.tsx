import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { getObjectKeys } from '@rocket.chat/tools';
import { useEndpoint, useMethod, useRouter, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { roomFields } from '../../../../lib/publishFields';
import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { mapSubscriptionFromApi } from '../../../lib/utils/mapSubscriptionFromApi';
import { Rooms } from '../../../stores';
import NotFoundPage from '../../notFound/NotFoundPage';
import PageLoading from '../PageLoading';
import { useMainReady } from '../hooks/useMainReady';

const EmbeddedPreload = ({
	children,
	reference,
	type,
	rid,
}: {
	children: ReactNode;
	reference?: string;
	type?: RoomType;
	rid?: IRoom['_id'];
}) => {
	const ready = useMainReady();
	const router = useRouter();
	const uid = useUserId();

	const roomParams = useMemo(() => {
		// When opening by room id we resolve the room directly, not via type/name params.
		if (rid) {
			return null;
		}

		if (reference && type) {
			return { reference, type };
		}

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
	}, [reference, router, type, rid]);

	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const getRoomById = useMethod('getRoomById');
	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');

	const shouldFetch = (!!roomParams || !!rid) && !!uid;

	const {
		isPending: isLoading,
		isSuccess,
		isError,
	} = useQuery({
		// eslint-disable-next-line no-nested-ternary
		queryKey: rid
			? [...roomsQueryKeys.room(rid), 'embedded-preload', uid ?? undefined]
			: roomParams
				? roomsQueryKeys.roomReference(roomParams.reference, roomParams.type, uid ?? undefined)
				: [],
		queryFn: async () => {
			let roomData: Awaited<ReturnType<typeof getRoomById>> | Awaited<ReturnType<typeof getRoomByTypeAndName>> | null = null;
			if (rid) {
				roomData = await getRoomById(rid);
			} else if (roomParams) {
				roomData = await getRoomByTypeAndName(roomParams.type, roomParams.reference);
			}

			if (!roomData?._id) {
				return null;
			}
			Rooms.state.store(roomData);

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

	// When an explicit room target is requested (e.g. the embedded conference chat, by rid or by
	// type/name) and it can't be resolved, render a 404 instead of mounting the children. Mounting
	// them would re-fetch the same room and, combined with the forced cached-store readiness above,
	// loops on the room lookup. MainLayout passes no target, so it keeps rendering children.
	if ((rid || (reference && type)) && isError) {
		return <NotFoundPage />;
	}

	if (!ready || (shouldFetch && isLoading)) {
		return <PageLoading />;
	}

	return <>{children}</>;
};

export default EmbeddedPreload;
