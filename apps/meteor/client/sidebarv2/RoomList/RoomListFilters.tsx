import { Divider, Box } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import type { Components } from 'react-virtuoso';

import OmnichannelFilters from './OmnichannelFilters';
import TeamCollabFilters from './TeamCollabFilters';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { SIDE_PANEL_GROUPS } from '../../views/navigation/contexts/RoomsNavigationContext';

const RoomListFilters: Components['Header'] = forwardRef(function RoomListWrapper(_, ref) {
	const showOmnichannel = useOmnichannelEnabled();

	if (Object.values(SIDE_PANEL_GROUPS).length === 0) {
		return null;
	}

	return (
		<Box ref={ref} display='flex' flexDirection='column'>
			<TeamCollabFilters />
			<Divider borderColor='stroke-light' mb={4} mi={16} />
			{showOmnichannel && <OmnichannelFilters />}
		</Box>
	);
});

export default RoomListFilters;
