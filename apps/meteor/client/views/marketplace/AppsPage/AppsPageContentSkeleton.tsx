import { Skeleton, Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const AppsPageContentSkeleton = (): ReactElement => {
	const loadingRows = Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height='x56' mbe={8} width='100%' variant='rect' />);
	return (
		<Box pi={24}>
			<Box mbe={36}>
				<Skeleton height='x28' width='x150' mbe={20} variant='rect' />
				{loadingRows}
			</Box>
			<Box mbe={36}>
				<Skeleton height='x28' width='x150' mbe={20} variant='rect' />
				{loadingRows}
			</Box>
			<Skeleton height='x28' width='x150' mbe={20} variant='rect' />
			{loadingRows}
		</Box>
	);
};

export default AppsPageContentSkeleton;
