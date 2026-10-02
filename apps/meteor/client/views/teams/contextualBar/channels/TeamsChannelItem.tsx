import type { IRoom } from '@rocket.chat/core-typings';
import {
	Icon,
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemRow,
	ItemSkeleton,
	ItemTitle,
	Tag,
} from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import TeamsChannelItemMenu from './TeamsChannelItemMenu';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { useDeferredMenuMount } from '../../../../sidebar/Item/useDeferredMenuMount';

export type TeamsChannelItemProps = {
	room: IRoom;
	mainRoom: IRoom;
	onClickView: (room: IRoom) => void;
	reload: () => void;
};

const TeamsChannelItem = ({ room, mainRoom, onClickView, reload }: TeamsChannelItemProps) => {
	const { t } = useTranslation();
	const rid = room._id;
	const type = room.t;

	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	const canRemoveTeamChannel = usePermission('remove-team-channel', mainRoom._id);
	const canEditTeamChannel = usePermission('edit-team-channel', mainRoom._id);
	const canDeleteChannel = usePermission(`delete-${type}`, rid);
	const canDeleteTeamChannel = usePermission(`delete-team-${type === 'c' ? 'channel' : 'group'}`, mainRoom._id);
	const canDelete = canDeleteChannel && canDeleteTeamChannel;

	if (!room) {
		return <ItemSkeleton size='medium' inset='lg' />;
	}

	return (
		<Item role='listitem' size='medium' inset='lg' id={room._id} data-rid={room._id} onFocus={mountNow} onPointerEnter={requestMount}>
			<ItemMedia>
				<RoomAvatar room={room} size='x28' />
			</ItemMedia>
			<ItemIcon label={room.t === 'c' ? t('Public_Channel') : t('Private_Channel')}>
				<Icon name={room.t === 'c' ? 'hash' : 'hashtag-lock'} size='x16' />
			</ItemIcon>
			<ItemContent>
				<ItemRow>
					<ItemTitle>
						<ItemLink is='button' onClick={() => onClickView(room)}>
							{roomCoordinator.getRoomName(room.t, room)}
						</ItemLink>
					</ItemTitle>
					{room.teamDefault && <Tag>{t('Team_Auto-join')}</Tag>}
				</ItemRow>
			</ItemContent>
			{(canRemoveTeamChannel || canEditTeamChannel || canDelete) && (
				<ItemActions reveal='hover'>
					{menuVisibility ? (
						<TeamsChannelItemMenu room={room} mainRoom={mainRoom} reload={reload} />
					) : (
						<IconButton small icon='kebab' aria-hidden tabIndex={-1} onPointerDown={mountNow} />
					)}
				</ItemActions>
			)}
		</Item>
	);
};

export default TeamsChannelItem;
