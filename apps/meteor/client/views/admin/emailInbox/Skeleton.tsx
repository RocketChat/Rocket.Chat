import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

export const FormSkeleton = (): ReactElement => (
	<Box w='full' pb='x24'>
		<Skeleton mbe='x8' />
		<Skeleton mbe='x4' />
		<Skeleton mbe='x4' />
		<Skeleton mbe='x8' />
		<Skeleton mbe='x4' />
		<Skeleton mbe='x8' />
	</Box>
);
