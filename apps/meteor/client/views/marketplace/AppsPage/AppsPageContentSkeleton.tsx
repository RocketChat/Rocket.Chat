import { Skeleton, Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const AppsPageContentSkeleton = (): ReactElement => {
	const loadingRows = Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height='x56' mbe='x8' width='100%' variant='rect' />);
	return (
		<>
			<Box mbe='x36'>
				<Skeleton height='x28' width='x150' mbe='x20' variant='rect' />
				{loadingRows}
			</Box>
			<Box mbe='x36'>
				<Skeleton height='x28' width='x150' mbe='x20' variant='rect' />
				{loadingRows}
			</Box>
			<Skeleton height='x28' width='x150' mbe='x20' variant='rect' />
			{loadingRows}
		</>
	);
};

export default AppsPageContentSkeleton;
