import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const ThreadSkeleton = (): ReactElement => {
	return (
		<Box p={24}>
			<Skeleton width='32px' height='32px' variant='rect' /> <Skeleton />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</Box>
	);
};

export default ThreadSkeleton;
