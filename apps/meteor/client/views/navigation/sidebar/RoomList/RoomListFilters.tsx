import { Box } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';
import type { Components } from 'react-virtuoso';

import OmnichannelFilters from './OmnichannelFilters';
import TeamCollabFilters from './TeamCollabFilters';
import { useOmnichannelEnabled } from '../../../../hooks/omnichannel/useOmnichannelEnabled';

const RoomListFilters: Components['Header'] = forwardRef(function RoomListWrapper(_, ref) {
	const showOmnichannel = useOmnichannelEnabled();

	return (
		<Box ref={ref} display='flex' flexDirection='column'>
			<TeamCollabFilters />
			{showOmnichannel && <OmnichannelFilters />}
		</Box>
	);
});

export default RoomListFilters;
