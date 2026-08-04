import type { BoxProps } from '@rocket.chat/fuselage';
import { Box, Skeleton } from '@rocket.chat/fuselage';

export const FormSkeleton = (props: BoxProps) => (
	<Box width='full' paddingBlock={24} {...props}>
		<Skeleton marginBlockEnd={8} />
		<Skeleton marginBlockEnd={4} />
		<Skeleton marginBlockEnd={4} />
		<Skeleton marginBlockEnd={8} />
		<Skeleton marginBlockEnd={4} />
		<Skeleton marginBlockEnd={8} />
	</Box>
);
