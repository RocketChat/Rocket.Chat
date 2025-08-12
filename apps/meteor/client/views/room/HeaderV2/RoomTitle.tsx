import { isTeamRoom, type IRoom } from '@rocket.chat/core-typings';
import { useButtonPattern, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useDocumentTitle } from '@rocket.chat/ui-client';

import HeaderIconWithRoom from './HeaderIconWithRoom';
import { HeaderTitle, HeaderTitleButton } from '../../../components/Header';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';

type RoomTitleProps = { room: IRoom };

const RoomTitle = ({ room }: RoomTitleProps) => {
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

			case 'v':
				openTab('voip-room-info');
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
		<HeaderTitleButton {...buttonProps} mie={4}>
			<HeaderIconWithRoom room={room} />
			<HeaderTitle>{room.name}</HeaderTitle>
		</HeaderTitleButton>
	);
};

export default RoomTitle;
