import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

export const FormSkeleton = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box w='full' pb={24} {...props}>
		<Skeleton mbe={8} />
		<Skeleton mbe={4} />
		<Skeleton mbe={4} />
		<Skeleton mbe={8} />
		<Skeleton mbe={4} />
		<Skeleton mbe={8} />
	</Box>
);
