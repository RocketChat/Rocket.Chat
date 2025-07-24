import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { useTemplateByViewMode } from '../../../../sidebarv2/hooks/useTemplateByViewMode';
import { useItemData } from '../hooks/useItemData';

type RoomSidepanelItemProps = {
	openedRoom?: string;
	room: SubscriptionWithRoom;
	parentRid: string;
	viewMode?: 'extended' | 'medium' | 'condensed';
};

const RoomSidepanelItem = ({ room, openedRoom, viewMode }: RoomSidepanelItemProps) => {
	const SidepanelItem = useTemplateByViewMode();

	const itemData = useItemData(room, { viewMode, openedRoom });

	return <SidepanelItem {...itemData} />;
};

export default memo(RoomSidepanelItem);
