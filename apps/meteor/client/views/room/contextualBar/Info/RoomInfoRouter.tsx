import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState } from 'react';

import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import EditRoomInfoWithData from './EditRoomInfo';
import RoomInfo from './RoomInfo';
import { useCanEditRoom } from './hooks/useCanEditRoom';

type RoomInfoRouterProps = {
	onClickBack?: () => void;
	onEnterRoom?: (room: IRoom) => void;
	resetState?: () => void;
};

const RoomInfoRouter = ({ onClickBack, onEnterRoom, resetState }: RoomInfoRouterProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const { openTab, closeTab } = useRoomToolbox();
	const room = useRoom();

	const canEdit = useCanEditRoom(room);
	const onClickEnterRoom = useEffectEvent(() => onEnterRoom?.(room));
	const onClickViewChannels = useCallback(() => openTab('team-channels'), [openTab]);

	if (isEditing) {
		return <EditRoomInfoWithData onClickBack={() => setIsEditing(false)} />;
	}

	return (
		<RoomInfo
			room={room}
			onClickBack={onClickBack}
			onClickEdit={canEdit ? () => setIsEditing(true) : undefined}
			onClickClose={closeTab}
			{...(Boolean(onEnterRoom) && {
				onClickEnterRoom,
			})}
			onClickViewChannels={room.teamMain ? onClickViewChannels : undefined}
			resetState={resetState}
		/>
	);
};

export default RoomInfoRouter;
