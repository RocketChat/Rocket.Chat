import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import { useTemplateByViewMode } from '../../../../sidebarv2/hooks/useTemplateByViewMode';
import { useItemData } from '../hooks/useItemData';

export type RoomSidepanelItemProps = {
	openedRoom?: string;
	room: IRoom;
	parentRid: string;
	viewMode?: 'extended' | 'medium' | 'condensed';
};

const RoomSidepanelItem = ({ room, openedRoom, viewMode }: RoomSidepanelItemProps) => {
	const SidepanelItem = useTemplateByViewMode();
	const subscription = useUserSubscription(room._id);

	const itemData = useItemData({ ...room, ...subscription } as ISubscription & IRoom, { viewMode, openedRoom }); // as any because of divergent and overlaping timestamp types in subs and room (type Date vs type string)

	if (!subscription) {
		return <SidepanelItem onClick={goToRoomById} is='a' {...itemData} />;
	}

	return <SidepanelItem onClick={goToRoomById} {...itemData} />;
};

export default memo(RoomSidepanelItem);
