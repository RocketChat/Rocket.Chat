import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import ThreadVerticalBar from './ThreadVerticalBar';

type ThreadSkeletonProps = {
	onBack: () => void;
	onClose: () => void;
};

const ThreadSkeleton = ({ onBack, onClose }: ThreadSkeletonProps): ReactElement => (
	<ThreadVerticalBar title={<Skeleton width='100%' />} onBack={onBack} onClose={onClose}>
		<Box p='x24'>
			<Skeleton width='32px' height='32px' variant='rect' /> <Skeleton />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</Box>
	</ThreadVerticalBar>
);

export default ThreadSkeleton;
