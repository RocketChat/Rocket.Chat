import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { memo } from 'react';

type ContextualBarListSkeletonProps = {
	itemCount?: number;
};

const ContextualBarListSkeleton = ({ itemCount = 5 }: ContextualBarListSkeletonProps): ReactElement => {
	return (
		<Box p={24}>
			{Array.from({ length: itemCount }).map((_, index) => (
				<Box key={index} display='flex' alignItems='center' mb={12}>
					<Skeleton variant='rect' width={40} height={40} borderRadius='x4' />
					<Box mi={8} flexGrow={1}>
						<Skeleton variant='text' width='100%' />
						<Skeleton variant='text' width='60%' />
					</Box>
				</Box>
			))}
		</Box>
	);
};

export default memo(ContextualBarListSkeleton);
