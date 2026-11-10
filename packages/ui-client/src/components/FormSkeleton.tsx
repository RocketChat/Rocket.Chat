import { Box, Skeleton, Stack } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export const FormSkeleton = (props: ComponentProps<typeof Box>) => (
	<Box width='full' paddingBlock='x24' display='flex' flexDirection='column' gap='x8' {...props}>
		<Skeleton />
		<Stack gap='x4'>
			<Skeleton />
			<Skeleton />
			<Skeleton />
		</Stack>
		<Box display='flex' flexDirection='column' gap='x4' paddingBlockEnd='x8'>
			<Skeleton />
			<Skeleton />
		</Box>
	</Box>
);
