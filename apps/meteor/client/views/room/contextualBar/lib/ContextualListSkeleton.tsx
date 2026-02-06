import type { FC } from 'react';
import { Box, Skeleton } from '@rocket.chat/fuselage';

type ContextualListSkeletonProps = {
	items?: number;
};

const ContextualListSkeleton: FC<ContextualListSkeletonProps> = ({ items = 6 }) => (
	<Box p='x24'>
		{Array.from({ length: items }).map((_, i) => (
			<Box key={i} display='flex' alignItems='center' mb='x12'>
				<Skeleton variant='rect' width='x40' height='x40' borderRadius='x4' />
				<Box mi='x8' flexGrow={1}>
					<Skeleton variant='text' width='100%' />
					<Skeleton variant='text' width='60%' />
				</Box>
			</Box>
		))}
	</Box>
);

export default ContextualListSkeleton;
