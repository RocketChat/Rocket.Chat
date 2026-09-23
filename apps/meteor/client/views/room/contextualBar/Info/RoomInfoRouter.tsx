import type { IRoom } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import EditRoomInfoWithData from './EditRoomInfo';
import RoomInfo from './RoomInfo';
import { useCanEditRoom } from './hooks/useCanEditRoom';
import { useRoom } from '../../contexts/RoomContext';

export type RoomInfoRouterProps = {
	onClickBack?: () => void;
	onEnterRoom?: (room: IRoom) => void;
	resetState?: () => void;
};

const RoomInfoRouter = ({ onClickBack, onEnterRoom, resetState }: RoomInfoRouterProps) => {
	const { closeTab, context } = useRoomToolbox();
	const room = useRoom();

	const canEdit = useCanEditRoom(room);

	// Opening this tab with the `edit` context lands directly on the edit form, so a caller that
	// already knows the user wants to edit — e.g. the "Edit channel" action on the ABAC locked-room
	// callout (ABAC-P4 M1) — does not make them click through room info first. Still gated on
	// `canEdit`, so the context can never grant a panel the permission check would refuse.
	const [isEditing, setIsEditing] = useState(context === 'edit' && canEdit);
	const onClickEnterRoom = useStableCallback(() => onEnterRoom?.(room));

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
