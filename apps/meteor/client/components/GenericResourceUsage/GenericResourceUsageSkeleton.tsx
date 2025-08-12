import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type GenericResourceUsageSkeletonProps = {
	title?: string;
} & ComponentProps<typeof Box>;

const GenericResourceUsageSkeleton = ({ title, ...props }: GenericResourceUsageSkeletonProps) => {
	return (
		<Box w='x180' h='x40' mi={8} fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around' {...props}>
			{title ? <Box color='default'>{title}</Box> : <Skeleton w='full' />}
			<Skeleton w='full' />
		</Box>
	);
};

export default GenericResourceUsageSkeleton;
