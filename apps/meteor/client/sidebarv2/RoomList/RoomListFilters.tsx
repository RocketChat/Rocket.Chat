import { Divider, Box } from '@rocket.chat/fuselage';

import OmnichannelFilters from './OmnichannelFilters';
import RoomListFiltersItem from './RoomListFiltersItem';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { sidePanelFiltersConfig, SIDE_PANEL_GROUPS, TEAM_COLLAB_GROUPS } from '../../views/navigation/contexts/RoomsNavigationContext';

const RoomListFilters = () => {
	// const favoritesEnabled = useUserPreference('sidebarShowFavorites', true);
	const showOmnichannel = useOmnichannelEnabled();

	if (Object.values(SIDE_PANEL_GROUPS).length === 0) {
		return null;
	}

	return (
		<Box display='flex' flexDirection='column'>
			<Box role='tablist' aria-orientation='vertical' mbs={8}>
				{Object.values(TEAM_COLLAB_GROUPS).map((group) => (
					<RoomListFiltersItem key={group} group={group} icon={sidePanelFiltersConfig[group].icon} />
				))}
			</Box>
			<Divider borderColor='stroke-light' mb={4} mi={16} />
			{showOmnichannel && <OmnichannelFilters />}
		</Box>
	);
};

export default RoomListFilters;
