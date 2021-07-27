import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import Extended from './Extended';

const ExtendedSkeleton = ({ showAvatar }) => (
	<Box height='x44'>
		<Extended
			title={<Skeleton width='100%' />}
			titleIcon={<Box mi='x4'>{<Skeleton width={12} />}</Box>}
			subtitle={<Skeleton width='100%' />}
			avatar={showAvatar && <Skeleton variant='rect' width={38} height={38} />}
		/>
	</Box>
);

export default ExtendedSkeleton;
