import type { IRoom, IDiscussionMessage } from '@rocket.chat/core-typings';
import type { Keys } from '@rocket.chat/icons';
import React, { memo, useCallback } from 'react';

import { useSecondLevelOpenedRoom } from '../../../../lib/RoomManager';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

export type RoomSidePanelItemProps = {
	id: string | undefined;
	name: string | undefined;
	icon: Keys;
} & (Partial<IRoom> | Partial<IDiscussionMessage>);

const RoomSidePanelItem = (props: RoomSidePanelItemProps) => {
	const SidepanelItem = useTemplateByViewMode();
	const onClick = useCallback((id) => {
		goToRoomById(id);
	}, []);

	const openedRoom = useSecondLevelOpenedRoom();

	return <SidepanelItem openedRoom={openedRoom} onClick={onClick} {...props} />;
};

export default memo(RoomSidePanelItem);
