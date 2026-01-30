import { isTeamRoom, type IRoom } from '@rocket.chat/core-typings';
import { useButtonPattern, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useDocumentTitle, HeaderTitle, HeaderTitleButton } from '@rocket.chat/ui-client';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import HeaderIconWithRoom from './HeaderIconWithRoom';

type RoomTitleProps = { room: IRoom };

const RoomTitle = ({ room }: RoomTitleProps) => {
	const { t } = useTranslation();

	useDocumentTitle(room.name, false);
	const { openTab } = useRoomToolbox();

	const handleOpenRoomInfo = useEffectEvent(() => {
		if (isTeamRoom(room)) {
			return openTab('team-info');
		}

		switch (room.t) {
			case 'l':
				openTab('room-info');
				break;

			case 'd':
				(room.uids?.length ?? 0) > 2 ? openTab('user-info-group') : openTab('user-info');
				break;

			default:
				openTab('channel-settings');
				break;
		}
	});

	const buttonProps = useButtonPattern(handleOpenRoomInfo);

	return (
		<HeaderTitleButton aria-label={`${room.name}${room.encrypted ? ` - ${t('encrypted')}` : ''}`} {...buttonProps} mie={4}>
			<HeaderIconWithRoom room={room} />
			<HeaderTitle>{room.name}</HeaderTitle>
		</HeaderTitleButton>
	);
};

export default RoomTitle;
