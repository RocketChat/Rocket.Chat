import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IUser, IInviteSubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import Header from './Header';
import RoomInviteBody from './body/RoomInviteBody';
import { useGoToHomeOnRemoved } from './body/hooks/useGoToHomeOnRemoved';
import type { IRoomWithFederationOriginalName } from './contexts/RoomContext';
import { useRoomInvitation } from './hooks/useRoomInvitation';
import RoomLayout from './layout/RoomLayout';
import { links } from '../../lib/links';
import { roomsQueryKeys, subscriptionsQueryKeys } from '../../lib/queryKeys';

type RoomInviteProps = Omit<ComponentProps<typeof RoomLayout>, 'header' | 'body' | 'aside'> & {
	userId?: IUser['_id'];
	room: IRoomWithFederationOriginalName;
	subscription: IInviteSubscription;
};

const RoomInvite = ({ room, subscription, userId, ...props }: RoomInviteProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { acceptInvite, rejectInvite, isPending } = useRoomInvitation(room);

	const infoLink = isRoomFederated(room) ? { label: t('Learn_more_about_Federation'), href: links.go.matrixFederation } : undefined;

	useGoToHomeOnRemoved(room, userId);

	const invalidateQueries = useEffectEvent(() => {
		const reference = room.federationOriginalName ?? room.name ?? room._id;
		void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.room(room._id) });
		void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.subscription(room._id) });
		void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.roomReference(reference, room.t, userId) });
	});

	useEffect(() => {
		// Invalidate room and subscription queries when unmounting (invite accepted or rejected)
		return () => invalidateQueries();
	}, [invalidateQueries]);

	return (
		<RoomLayout
			{...props}
			header={<Header room={room} subscription={subscription} />}
			body={
				<RoomInviteBody
					inviter={subscription.inviter}
					infoLink={infoLink}
					isLoading={isPending}
					onAccept={acceptInvite}
					onReject={rejectInvite}
				/>
			}
		/>
	);
};

export default RoomInvite;
