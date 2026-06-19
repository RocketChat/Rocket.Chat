import type { ISubscription } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout, useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, Suspense, useEffect, useMemo } from 'react';

import { SubscriptionsCachedStore } from '../../cachedStores';
import { NotAuthorizedError } from '../../lib/errors/NotAuthorizedError';
import RoomSkeleton from '../room/RoomSkeleton';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const Room = lazy(() => import('../room/Room'));
const RoomNotFound = lazy(() => import('../room/RoomNotFound'));
const NotAuthorizedPage = lazy(() => import('../notAuthorized/NotAuthorizedPage'));

type ConferenceRoomProps = {
	rid: string;
};

const ConferenceRoom = ({ rid }: ConferenceRoomProps): ReactElement => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoomById(rid);
	const uid = useUserId();
	const subscribeToNotifyUser = useStream('notify-user');
	const layoutContext = useLayout();
	const layoutContextEmbedded = useMemo(() => ({ ...layoutContext, isEmbedded: true }), [layoutContext]);

	useEffect(() => {
		if (!uid || !data?.rid) {
			return;
		}

		return subscribeToNotifyUser(`${uid}/subscriptions-changed`, (event, sub) => {
			if (sub.rid !== data.rid || event === 'removed') {
				return;
			}

			SubscriptionsCachedStore.upsertSubscription(sub as ISubscription);
		});
	}, [data?.rid, subscribeToNotifyUser, uid]);

	return (
		<LayoutContext.Provider value={layoutContextEmbedded}>
			<Box display='flex' w='full' h='full'>
				<Suspense fallback={<RoomSkeleton />}>
					{isLoading && <RoomSkeleton />}
					{isSuccess && (
						<RoomProvider rid={data.rid}>
							<Room />
						</RoomProvider>
					)}
					{isError && (error instanceof NotAuthorizedError ? <NotAuthorizedPage /> : <RoomNotFound />)}
				</Suspense>
			</Box>
		</LayoutContext.Provider>
	);
};

export default ConferenceRoom;
