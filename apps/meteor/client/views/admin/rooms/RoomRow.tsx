import { isDiscussion } from '@rocket.chat/core-typings';
import type { IRoom, RoomAdminFieldsType, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableCell, GenericTableRow } from '../../../components/GenericTable';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

const roomTypeI18nMap = {
	l: 'Omnichannel',
	c: 'Channel',
	d: 'Direct_Message',
	p: 'Private_Channel',
} as const;

const getRoomDisplayName = (room: Pick<Serialized<IRoom>, RoomAdminFieldsType>): string | undefined =>
	room.t === 'd' ? room.usernames?.join(' x ') : roomCoordinator.getRoomName(room.t, room as IRoom);

const RoomRow = ({ room }: { room: Pick<Serialized<IRoom>, RoomAdminFieldsType> }) => {
	const { t } = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');
	const router = useRouter();
	const formatDate = useFormatDate();

	const { _id, t: type, usersCount, msgs, default: isDefault, featured, ts, ...args } = room;
	const icon = roomCoordinator.getRoomDirectives(room.t).getIcon?.(room as IRoom);
	const roomName = getRoomDisplayName(room);

	const getRoomType = (
		room: Pick<Serialized<IRoom>, RoomAdminFieldsType>,
	): (typeof roomTypeI18nMap)[keyof typeof roomTypeI18nMap] | 'Teams_Public_Team' | 'Teams_Private_Team' | 'Discussion' => {
		if (room.teamMain) {
			return room.t === 'c' ? 'Teams_Public_Team' : 'Teams_Private_Team';
		}
		if (isDiscussion(room as IRoom)) {
			return 'Discussion';
		}
		return roomTypeI18nMap[(room as IRoom).t as keyof typeof roomTypeI18nMap];
	};

	const onClick = useCallback(
		(rid: string) => (): void =>
			router.navigate({
				name: 'admin-rooms',
				params: {
					context: 'edit',
					id: rid,
				},
			}),
		[router],
	);

	return (
		<GenericTableRow action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' qa-room-id={_id}>
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignContent='center'>
					<RoomAvatar size={mediaQuery ? 'x28' : 'x40'} room={{ type, name: roomName, _id, ...args }} />
					<Box
						display='flex'
						flexGrow={1}
						flexShrink={1}
						flexBasis='0%'
						flexDirection='row'
						alignSelf='center'
						alignItems='center'
						withTruncatedText
					>
						{icon && <Icon mi={4} name={icon} fontScale='p2m' color='hint' />}
						<Box fontScale='p2m' withTruncatedText color='default' qa-room-name={roomName}>
							{roomName}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell>
				<Box color='hint' fontScale='p2m' withTruncatedText>
					{t(getRoomType(room))}
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{usersCount}</GenericTableCell>
			{mediaQuery && <GenericTableCell withTruncatedText>{msgs}</GenericTableCell>}
			{mediaQuery && <GenericTableCell withTruncatedText>{isDefault ? t('True') : t('False')}</GenericTableCell>}
			{mediaQuery && <GenericTableCell withTruncatedText>{featured ? t('True') : t('False')}</GenericTableCell>}
			{mediaQuery && <GenericTableCell withTruncatedText>{ts ? formatDate(ts) : ''}</GenericTableCell>}
		</GenericTableRow>
	);
};

export default RoomRow;
