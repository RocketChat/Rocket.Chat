import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import { useTemplateByViewMode } from '../../../../sidebarv2/hooks/useTemplateByViewMode';
import { useItemData } from '../hooks/useItemData';

export type RoomSidepanelItemProps = {
	openedRoom?: string;
	room: Serialized<IRoom>;
	parentRid: string;
	viewMode?: 'extended' | 'medium' | 'condensed';
};

const RoomSidepanelItem = ({ room, openedRoom, viewMode }: RoomSidepanelItemProps) => {
	const SidepanelItem = useTemplateByViewMode();
	const subscription = useUserSubscription(room._id);

	const itemData = useItemData({ ...subscription, ...room } as any, { viewMode, openedRoom }); // as any because of divergent and overlaping timestamp types in subs and room (type Date vs type string)

	if (!subscription) {
		return <SidepanelItem onClick={goToRoomById} is='a' {...room} {...itemData} />;
	}

	return <SidepanelItem onClick={goToRoomById} {...subscription} {...itemData} />;
};

export default memo(RoomSidepanelItem);
