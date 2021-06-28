import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import VerticalBar from './VerticalBar';
import VerticalBarHeader from './VerticalBarHeader';

function VerticalBarSkeleton(props) {
	return (
		<VerticalBar {...props} width='100%'>
			<VerticalBarHeader>
				<Skeleton width='100%' />
			</VerticalBarHeader>
			<Box p='x24'>
				<Skeleton width='32px' height='32px' variant='rect' /> <Skeleton />
				{Array(5)
					.fill()
					.map((_, index) => (
						<Skeleton key={index} />
					))}
			</Box>
		</VerticalBar>
	);
}

export default memo(VerticalBarSkeleton);
