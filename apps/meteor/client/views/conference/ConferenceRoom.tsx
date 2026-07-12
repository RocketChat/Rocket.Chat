import type { ISubscription } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout, useStream, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, Suspense, useEffect, useMemo } from 'react';

import { SubscriptionsCachedStore } from '../../cachedStores';
import RoomSkeleton from '../room/RoomSkeleton';

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const Room = lazy(() => import('../room/Room'));

type ConferenceRoomProps = {
	rid: string;
};

const ConferenceRoom = ({ rid }: ConferenceRoomProps): ReactElement => {
	const uid = useUserId();
	const subscribeToNotifyUser = useStream('notify-user');
	const layoutContext = useLayout();
	const layoutContextEmbedded = useMemo(() => ({ ...layoutContext, isEmbedded: true }), [layoutContext]);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToNotifyUser(`${uid}/subscriptions-changed`, (event, sub) => {
			if (sub.rid !== rid || event === 'removed') {
				return;
			}

			SubscriptionsCachedStore.upsertSubscription(sub as ISubscription);
		});
	}, [rid, subscribeToNotifyUser, uid]);

	return (
		<LayoutContext.Provider value={layoutContextEmbedded}>
			<Box display='flex' w='full' h='full'>
				<Suspense fallback={<RoomSkeleton />}>
					<RoomProvider rid={rid}>
						<Room />
					</RoomProvider>
				</Suspense>
			</Box>
		</LayoutContext.Provider>
	);
};

export default ConferenceRoom;
