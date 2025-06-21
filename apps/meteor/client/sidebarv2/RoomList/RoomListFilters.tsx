import { Divider, Box } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import type { Components } from 'react-virtuoso';

import RoomListFiltersItem from './RoomListFiltersItem';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import {
	sidePanelFiltersConfig,
	OMNICHANNEL_GROUPS,
	SIDE_PANEL_GROUPS,
	TEAM_COLLAB_GROUPS,
	useSwitchSidePanelTab,
} from '../../views/navigation/contexts/RoomsNavigationContext';

const RoomListFilters: Components['Header'] = forwardRef(function RoomListWrapper(_, ref) {
	// const favoritesEnabled = useUserPreference('sidebarShowFavorites', true);
	const showOmnichannel = useOmnichannelEnabled();

	const switchSidePanelTab = useSwitchSidePanelTab();

	if (Object.values(SIDE_PANEL_GROUPS).length === 0) {
		return null;
	}

	return (
		<Box ref={ref} display='flex' flexDirection='column'>
			<Box role='tablist' aria-orientation='vertical' mbs={8}>
				{Object.values(TEAM_COLLAB_GROUPS).map((group) => (
					<RoomListFiltersItem
						key={group}
						group={group}
						icon={sidePanelFiltersConfig[group].icon}
						onClick={() => switchSidePanelTab(group)}
					/>
				))}
			</Box>
			<Divider borderColor='stroke-light' mb={4} mi={16} />
			{showOmnichannel && (
				<>
					<Box role='tablist' aria-orientation='vertical'>
						{Object.values(OMNICHANNEL_GROUPS).map((group) => (
							<RoomListFiltersItem
								key={group}
								group={group}
								icon={sidePanelFiltersConfig[group].icon}
								onClick={() => switchSidePanelTab(group)}
							/>
						))}
					</Box>
					<Divider borderColor='stroke-light' mb={4} mi={16} />
				</>
			)}
		</Box>
	);
});

export default RoomListFilters;
