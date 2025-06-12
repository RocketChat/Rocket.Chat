import { Divider, Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { forwardRef } from 'react';
import type { Components } from 'react-virtuoso';

import RoomListFiltersItem from './RoomListFiltersItem';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import type { SidePanelFiltersKeys } from '../../views/navigation/contexts/RoomsNavigationContext';
import {
	OMNICHANNEL_GROUPS,
	SIDE_PANEL_GROUPS,
	TEAM_COLLAB_GROUPS,
	useSwitchSidePanelTab,
	useSidePanelFilter,
} from '../../views/navigation/contexts/RoomsNavigationContext';

const filtersIcons: { [Key in SidePanelFiltersKeys]: IconName } = {
	All: 'inbox',
	Mentions: 'at',
	Favorites: 'star',
	Discussions: 'baloons',
	In_progress: 'user-arrow-right',
	Queue: 'burger-arrow-left',
	On_Hold: 'pause-unfilled',
};

const RoomListFilters: Components['Header'] = forwardRef(function RoomListWrapper(_, ref) {
	// const favoritesEnabled = useUserPreference('sidebarShowFavorites', true);
	const showOmnichannel = useOmnichannelEnabled();

	const switchSidePanelTab = useSwitchSidePanelTab();
	const [currentTab] = useSidePanelFilter();

	if (Object.values(SIDE_PANEL_GROUPS).length === 0) {
		return null;
	}

	return (
		<Box ref={ref} display='flex' flexDirection='column'>
			<Box role='tablist' aria-orientation='vertical' mbs={8}>
				{Object.values(TEAM_COLLAB_GROUPS).map((group) => (
					<RoomListFiltersItem
						key={group}
						title={group}
						selected={currentTab === group}
						icon={filtersIcons[group]}
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
								title={group}
								selected={currentTab === group}
								icon={filtersIcons[group]}
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
