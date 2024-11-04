import { SidebarV2Item as SidebarItem, Sidepanel, SidepanelList, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

const RoomSidepanelLoading = () => (
	<Sidepanel>
		<SidepanelList>
			<SidebarItem>
				<Skeleton w='full' />
			</SidebarItem>
			<SidebarItem>
				<Skeleton w='full' />
			</SidebarItem>
			<SidebarItem>
				<Skeleton w='full' />
			</SidebarItem>
		</SidepanelList>
	</Sidepanel>
);

export default RoomSidepanelLoading;
