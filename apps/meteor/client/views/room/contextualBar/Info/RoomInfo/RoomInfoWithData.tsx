import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useTabBarClose } from '../../../contexts/ToolboxContext';
import { useCanEditRoom } from '../hooks/useCanEditRoom';
import RoomInfo from './RoomInfo';

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
		throw new Error();
	}

	// TODO implement joined
	// const { type, fname, name, prid, joined = true } = room;

	const canEdit = useCanEditRoom(room);
	const onClickEnterRoom = useMutableCallback(() => onEnterRoom(room));

	return (
		<RoomInfo
			room={room}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			onClickBack={onClickBack}
			{...(canEdit && {
				onClickEdit: openEditing,
			})}
			onClickClose={onClickClose}
			onClickEnterRoom={onClickEnterRoom}
			resetState={resetState}
		/>
	);
};

export default RoomInfoWithData;
