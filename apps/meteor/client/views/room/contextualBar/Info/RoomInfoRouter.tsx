import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';

import EditRoomInfoWithData from './EditRoomInfo';
import RoomInfo from './RoomInfo';
import { useCanEditRoom } from './hooks/useCanEditRoom';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type RoomInfoRouterProps = {
	onClickBack?: () => void;
	onEnterRoom?: (room: IRoom) => void;
	resetState?: () => void;
};

const RoomInfoRouter = ({ onClickBack, onEnterRoom, resetState }: RoomInfoRouterProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const { closeTab } = useRoomToolbox();
	const room = useRoom();

	const canEdit = useCanEditRoom(room);
	const onClickEnterRoom = useEffectEvent(() => onEnterRoom?.(room));

	if (isEditing) {
		return <EditRoomInfoWithData onClickBack={() => setIsEditing(false)} />;
	}

	return (
		<RoomInfo
			room={room}
			icon={room.t === 'p' ? 'lock' : 'hashtag'}
			onClickBack={onClickBack}
			onClickEdit={canEdit ? () => setIsEditing(true) : undefined}
			onClickClose={closeTab}
			{...(Boolean(onEnterRoom) && {
				onClickEnterRoom,
			})}
			resetState={resetState}
		/>
	);
};

export default RoomInfoRouter;
