import { Divider, Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
// import { useUserPreference } from '@rocket.chat/ui-contexts';

import SidebarFiltersItem from './SidebarFiltersItem';
import { useOmnichannelEnabled } from '../hooks/omnichannel/useOmnichannelEnabled';
import type { SidePanelFilters } from '../views/navigation/contexts/RoomsNavigationContext';
import {
	OMNICHANNEL_GROUPS,
	SIDE_PANEL_GROUPS,
	TEAM_COLLAB_GROUPS,
	useSidePanelRoomsList,
} from '../views/navigation/contexts/RoomsNavigationContext';

const filtersIcons: { [Key in SidePanelFilters]: IconName } = {
	All: 'inbox',
	Mentions: 'at',
	Starred: 'star',
	Discussions: 'baloons',
	In_progress: 'user-arrow-right',
	Queue: 'burger-arrow-left',
	On_Hold: 'pause-unfilled',
};

const SidebarFilters = () => {
	// const favoritesEnabled = useUserPreference('sidebarShowFavorites', true);
	const showOmnichannel = useOmnichannelEnabled();

	const {
		currentFilter: { filter, onlyUnReads },
		setCurrentFilter,
		groupedUnreadInfo,
	} = useSidePanelRoomsList();

	if (Object.values(SIDE_PANEL_GROUPS).length === 0) {
		return null;
	}

	return (
		<>
			<Box role='group' mb={8}>
				{Object.values(TEAM_COLLAB_GROUPS).map((group) => (
					<SidebarFiltersItem
						key={group}
						title={group}
						selected={filter === group}
						icon={filtersIcons[group]}
						unreadGroupCount={groupedUnreadInfo[group]}
						onClick={() => setCurrentFilter({ onlyUnReads, filter: group })}
					/>
				))}
			</Box>
			<Divider borderColor='stroke-light' mb={0} mi={16} />
			{showOmnichannel && (
				<>
					<Box mb={8}>
						{Object.values(OMNICHANNEL_GROUPS).map((group) => (
							<SidebarFiltersItem
								key={group}
								title={group}
								selected={filter === group}
								icon={filtersIcons[group]}
								unreadGroupCount={groupedUnreadInfo[group]}
								onClick={() => setCurrentFilter({ onlyUnReads, filter: group })}
							/>
						))}
					</Box>
					<Divider borderColor='stroke-light' mb={0} mi={16} />
				</>
			)}
		</>
	);
};

export default SidebarFilters;
