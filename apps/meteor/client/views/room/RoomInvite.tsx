import type { ComponentProps } from 'react';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';

import RoomHeader from '././RoomHeader';
import RoomInviteBody from './body/RoomInviteBody';
import { useRoomInvitation } from './hooks/useRoomInvitation';
import RoomLayout from './layout/RoomLayout';
import { useTranslation } from 'react-i18next';

type RoomInviteProps = Omit<ComponentProps<typeof RoomLayout>, 'header' | 'body' | 'aside'> & {
	room: IRoom;
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
