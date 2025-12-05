import type { ISubscription } from '@rocket.chat/core-typings';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import RoomHeader from './RoomHeader';
import RoomInviteBody from './body/RoomInviteBody';
import type { IRoomWithFederationOriginalName } from './contexts/RoomContext';
import { useRoomInvitation } from './hooks/useRoomInvitation';
import RoomLayout from './layout/RoomLayout';

type RoomInviteProps = Omit<ComponentProps<typeof RoomLayout>, 'header' | 'body' | 'aside'> & {
	room: IRoomWithFederationOriginalName;
	subscription?: ISubscription;
};

const RoomInvite = ({ room, subscription, ...props }: RoomInviteProps) => {
	const { t } = useTranslation();
	const { acceptInvite, rejectInvite, isPending } = useRoomInvitation(room);

	return (
		<RoomLayout
			{...props}
			header={<RoomHeader room={room} subscription={subscription} />}
			body={
				<RoomInviteBody
					isLoading={isPending}
					inviterUsername={subscription?.inviterUsername ?? t('unknown')}
					onAccept={acceptInvite}
					onReject={rejectInvite}
				/>
			}
		/>
	);
};

export default RoomInvite;
