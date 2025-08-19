import type { RoomType } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import NotSubscribedRoom from './NotSubscribedRoom';
import RoomSkeleton from './RoomSkeleton';
import { useOpenRoom } from './hooks/useOpenRoom';
import { LegacyRoomManager } from '../../../app/ui-utils/client';
import { SubscriptionsCachedStore } from '../../cachedStores';
import { Header } from '../../components/Header';
import { getErrorMessage } from '../../lib/errorHandling';
import { NotAuthorizedError } from '../../lib/errors/NotAuthorizedError';
import { NotSubscribedToRoomError } from '../../lib/errors/NotSubscribedToRoomError';
import { OldUrlRoomError } from '../../lib/errors/OldUrlRoomError';
import { RoomNotFoundError } from '../../lib/errors/RoomNotFoundError';
import { subscriptionsQueryKeys } from '../../lib/queryKeys';
import { mapSubscriptionFromApi } from '../../lib/utils/mapSubscriptionFromApi';

const RoomProvider = lazy(() => import('./providers/RoomProvider'));
const RoomNotFound = lazy(() => import('./RoomNotFound'));
const Room = lazy(() => import('./Room'));
const RoomLayout = lazy(() => import('./layout/RoomLayout'));
const NotAuthorizedPage = lazy(() => import('../notAuthorized/NotAuthorizedPage'));

type RoomOpenerProps = {
	type: RoomType;
	reference: string;
};

const RoomOpenerEmbedded = ({ type, reference }: RoomOpenerProps): ReactElement => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoom({ type, reference });
	const uid = useUserId();

	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');

	const subscribeToNotifyUser = useStream('notify-user');

	const rid = data?.rid;
	const { data: subscriptionData, refetch } = useQuery({
		queryKey: rid ? subscriptionsQueryKeys.subscription(rid) : [],
		queryFn: () => {
			if (!rid) {
				throw new Error('Room not found');
			}
			return getSubscription({ roomId: rid });
		},
		enabled: !!rid,
	});

	useEffect(() => {
		if (!subscriptionData?.subscription) {
			return;
		}

		SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(subscriptionData.subscription));

		// yes this must be done here, this is already called in useOpenRoom, but it skips subscription streams because of the subscriptions list is empty
		// now that we inserted the subscription, we can open the room
		LegacyRoomManager.open({ typeName: type + reference, rid: subscriptionData.subscription.rid });
	}, [subscriptionData, type, rid, reference]);

	useEffect(() => {
		if (!uid) {
			return;
		}
		return subscribeToNotifyUser(`${uid}/subscriptions-changed`, (event, sub) => {
			if (event !== 'inserted') {
				return;
			}

			if (sub.rid === rid) {
				refetch();
			}
		});
	}, [refetch, rid, subscribeToNotifyUser, uid]);

	const { t } = useTranslation();

	return (
		<Box display='flex' w='full' h='full'>
			<Suspense fallback={<RoomSkeleton />}>
				{isLoading && <RoomSkeleton />}
				{isSuccess && (
					<RoomProvider rid={data.rid}>
						<Room />
					</RoomProvider>
				)}
				{isError &&
					(() => {
						if (error instanceof OldUrlRoomError) {
							return <RoomSkeleton />;
						}

						if (error instanceof RoomNotFoundError) {
							return <RoomNotFound />;
						}

						if (error instanceof NotSubscribedToRoomError) {
							return <NotSubscribedRoom rid={error.details.rid} reference={reference} type={type} />;
						}

						if (error instanceof NotAuthorizedError) {
							return <NotAuthorizedPage />;
						}

						return (
							<RoomLayout
								header={<Header />}
								body={
									<States>
										<StatesIcon name='circle-exclamation' variation='danger' />
										<StatesTitle>{t('core.Error')}</StatesTitle>
										<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
									</States>
								}
							/>
						);
					})()}
			</Suspense>
		</Box>
	);
};

export default RoomOpenerEmbedded;
