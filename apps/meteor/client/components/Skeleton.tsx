import { Box, Skeleton, Stack } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export const FormSkeleton = (props: ComponentProps<typeof Box>) => (
	<Box width='full' paddingBlock={24} display='flex' flexDirection='column' gap={8} {...props}>
		<Skeleton />
		<Stack gap={4}>
			<Skeleton />
			<Skeleton />
			<Skeleton />
		</Stack>
		<Box display='flex' flexDirection='column' gap={4} paddingBlockEnd={8}>
			<Skeleton />
			<Skeleton />
		</Box>
	</Box>
);
