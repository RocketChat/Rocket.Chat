import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

export const FormSkeleton: FC = () => (
	<Box w='full' pb='x24'>
		<Skeleton mbe='x8' />
		<Skeleton mbe='x4' />
	</Box>
);
