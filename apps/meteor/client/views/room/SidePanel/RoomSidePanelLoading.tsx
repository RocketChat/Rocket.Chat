import { SideBarItem, SidePanel, SidePanelList, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

const RoomSidePanelLoading = () => (
	<SidePanel>
		<SidePanelList>
			<SideBarItem>
				<Skeleton w='full' />
			</SideBarItem>
			<SideBarItem>
				<Skeleton w='full' />
			</SideBarItem>
			<SideBarItem>
				<Skeleton w='full' />
			</SideBarItem>
		</SidePanelList>
	</SidePanel>
);

export default RoomSidePanelLoading;
