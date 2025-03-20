import { isTeamRoom, type IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import type { KeyboardEvent, ReactElement } from 'react';

import HeaderIconWithRoom from './HeaderIconWithRoom';
import { HeaderTitle, HeaderTitleButton } from '../../../components/Header';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';

const RoomTitle = ({ room }: { room: IRoom }): ReactElement => {
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

	return (
		<HeaderTitleButton
			onKeyDown={(e: KeyboardEvent) => (e.code === 'Enter' || e.code === 'Space') && handleOpenRoomInfo()}
			onClick={() => handleOpenRoomInfo()}
			tabIndex={0}
			role='button'
		>
			<HeaderIconWithRoom room={room} />
			<HeaderTitle is='h1'>{room.name}</HeaderTitle>
		</HeaderTitleButton>
	);
};

export default RoomTitle;
