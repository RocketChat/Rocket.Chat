import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export const FormSkeleton = (props: ComponentProps<typeof Box>) => (
	<Box width='full' paddingBlock={24} {...props}>
		<Skeleton marginBlockEnd={8} />
		<Skeleton marginBlockEnd={4} />
		<Skeleton marginBlockEnd={4} />
		<Skeleton marginBlockEnd={8} />
		<Skeleton marginBlockEnd={4} />
		<Skeleton marginBlockEnd={8} />
	</Box>
);
