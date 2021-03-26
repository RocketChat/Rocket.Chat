import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import Condensed from '../Condensed';

const CondensedSkeleton = ({ showAvatar }) => (
	<Box height='x28'>
		<Condensed
			title={<Skeleton width='100%' />}
			titleIcon={<Box mi='x4'>{<Skeleton width={12} />}</Box>}
			avatar={showAvatar && <Skeleton variant='rect' width={16} height={16} />}
		/>
	</Box>
);

export default CondensedSkeleton;
