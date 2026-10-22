import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type FormSkeletonProps = ComponentPropsWithoutRef<typeof Box>;

export const FormSkeleton = (props: FormSkeletonProps) => (
	<Box width='full' paddingBlock={24} display='flex' flexDirection='column' gap={8} {...props}>
		<Skeleton />
		<Box display='flex' flexDirection='column' gap={4}>
			<Skeleton />
			<Skeleton />
			<Skeleton />
		</Box>
		<Box display='flex' flexDirection='column' gap={4} paddingBlockEnd={8}>
			<Skeleton />
			<Skeleton />
		</Box>
	</Box>
);
