import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useTabBarClose } from '../../../contexts/ToolboxContext';
import RoomInfo from './RoomInfo';
import { useCanEditRoom } from './hooks/useCanEditRoom';

type RoomInfoWithDataProps = {
	rid: IRoom['_id'];
	openEditing?: () => void;
	onClickBack: () => void;
	onEnterRoom: (room: IRoom) => void;
	resetState: () => void;
};

const RoomInfoWithData = ({ rid, openEditing, onClickBack, onEnterRoom, resetState }: RoomInfoWithDataProps) => {
	const onClickClose = useTabBarClose();
	const room = useUserRoom(rid);

	if (!room) {
		throw new Error('Room not found');
	}

	const canEdit = useCanEditRoom(room);
	const onClickEnterRoom = useMutableCallback(() => onEnterRoom(room));

	return (
		<RoomInfo
			room={room}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			onClickBack={onClickBack}
			onClickEdit={canEdit ? openEditing : undefined}
			onClickClose={onClickClose}
			{...(Boolean(onEnterRoom) && {
				onClickEnterRoom,
			})}
			resetState={resetState}
		/>
	);
};

export default RoomInfoWithData;
