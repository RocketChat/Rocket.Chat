import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

export const FormSkeleton = (props) => (
	<Box w='full' pb='x24' {...props}>
		<Skeleton mbe='x8' />
		<Skeleton mbe='x4' />
		<Skeleton mbe='x4' />
		<Skeleton mbe='x8' />
		<Skeleton mbe='x4' />
		<Skeleton mbe='x8' />
	</Box>
);
