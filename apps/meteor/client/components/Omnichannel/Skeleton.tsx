import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type FormSkeletonProps = ComponentPropsWithoutRef<typeof Box>;

export const FormSkeleton = (props: FormSkeletonProps) => (
	<Box w='full' pb={24} {...props}>
		<Skeleton mbe={8} />
		<Skeleton mbe={4} />
	</Box>
);
