import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { VFC } from 'react';

import Medium from '../Medium';

const MediumSkeleton: VFC<{ showAvatar: boolean }> = ({ showAvatar }) => (
	<Box height='x36'>
		<Medium
			title={<Skeleton width='100%' />}
			titleIcon={<Box mi='x4'>{<Skeleton width={12} />}</Box>}
			avatar={showAvatar && <Skeleton variant='rect' width={28} height={28} />}
		/>
	</Box>
);

export default MediumSkeleton;
