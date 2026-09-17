import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type GenericResourceUsageSkeletonProps = {
	title?: string;
} & ComponentProps<typeof Box>;

const GenericResourceUsageSkeleton = ({ title, ...props }: GenericResourceUsageSkeletonProps) => {
	return (
		<Box
			width='x180'
			height='x40'
			marginInline={8}
			fontScale='c1'
			display='flex'
			flexDirection='column'
			justifyContent='space-around'
			{...props}
		>
			{title ? <Box color='default'>{title}</Box> : <Skeleton width='full' />}
			<Skeleton width='full' />
		</Box>
	);
};

export default GenericResourceUsageSkeleton;
