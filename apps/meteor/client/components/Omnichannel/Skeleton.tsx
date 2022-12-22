import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

export const FormSkeleton: FC = (props) => (
	<Box w='full' pb='x24' {...props}>
		<Skeleton mbe='x8' />
		<Skeleton mbe='x4' />
	</Box>
);
