import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps, memo } from 'react';

import VerticalBar from './VerticalBar';
import VerticalBarHeader from './VerticalBarHeader';

const VerticalBarSkeleton: FC<ComponentProps<typeof Box>> = (props) => (
	<VerticalBar {...props} width='100%'>
		<VerticalBarHeader>
			<Skeleton width='100%' />
		</VerticalBarHeader>
		<Box p='x24'>
			<Skeleton width='32px' height='32px' variant='rect' /> <Skeleton />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</Box>
	</VerticalBar>
);

export default memo(VerticalBarSkeleton);
