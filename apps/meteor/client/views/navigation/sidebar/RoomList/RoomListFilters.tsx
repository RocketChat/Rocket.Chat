import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import type { Components } from 'react-virtuoso';

import OmnichannelFilters from './OmnichannelFilters';
import TeamCollabFilters from './TeamCollabFilters';
import { useOmnichannelEnabled } from '../../../omnichannel/hooks/useOmnichannelEnabled';

const RoomListFilters: Components['Header'] = ({ ref }: ComponentProps<NonNullable<Components['Header']>> & RefAttributes<HTMLElement>) => {
	const showOmnichannel = useOmnichannelEnabled();

	return (
		<Box ref={ref} display='flex' flexDirection='column'>
			<TeamCollabFilters />
			{showOmnichannel && <OmnichannelFilters />}
		</Box>
	);
};

export default RoomListFilters;
