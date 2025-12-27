import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IUser, IInviteSubscription } from '@rocket.chat/core-typings';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import Header from './Header';
import RoomInviteBody from './body/RoomInviteBody';
import { useGoToHomeOnRemoved } from './body/hooks/useGoToHomeOnRemoved';
import type { IRoomWithFederationOriginalName } from './contexts/RoomContext';
import { useRoomInvitation } from './hooks/useRoomInvitation';
import RoomLayout from './layout/RoomLayout';
import { links } from '../../lib/links';

type RoomInviteProps = Omit<ComponentProps<typeof RoomLayout>, 'header' | 'body' | 'aside'> & {
	userId?: IUser['_id'];
	room: IRoomWithFederationOriginalName;
	subscription: IInviteSubscription;
};

const RoomInvite = ({ room, subscription, userId, ...props }: RoomInviteProps) => {
	const { t } = useTranslation();
	const { acceptInvite, rejectInvite, isPending } = useRoomInvitation(room);

	const infoLink = isRoomFederated(room) ? { label: t('Learn_more_about_Federation'), href: links.go.matrixFederation } : undefined;

	useGoToHomeOnRemoved(room, userId);

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
