import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import type { Components } from 'react-virtuoso';

import OmnichannelFilters from './OmnichannelFilters';
import TeamCollabFilters from './TeamCollabFilters';
import { useOmnichannelEnabled } from '../../../omnichannel/hooks/useOmnichannelEnabled';

export type RoomListFiltersProps = ComponentProps<NonNullable<Components['Header']>> & RefAttributes<HTMLElement>;

const RoomListFilters = ({ ref }: RoomListFiltersProps) => {
	const showOmnichannel = useOmnichannelEnabled();

	return (
		<Box ref={ref} display='flex' flexDirection='column'>
			<TeamCollabFilters />
			{showOmnichannel && <OmnichannelFilters />}
		</Box>
	);
};

export default RoomListFilters;
