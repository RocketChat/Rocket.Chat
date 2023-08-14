import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

export const FormSkeleton: FC = (props) => (
	<Box w='full' pb={24} {...props}>
		<Skeleton mbe={8} />
		<Skeleton mbe={4} />
	</Box>
);
