import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type FormSkeletonProps = ComponentPropsWithoutRef<typeof Box>;

export const FormSkeleton = (props: FormSkeletonProps) => (
	<Box width='full' paddingBlock={24} {...props}>
		<Skeleton marginBlockEnd={8} />
		<Skeleton marginBlockEnd={4} />
	</Box>
);
