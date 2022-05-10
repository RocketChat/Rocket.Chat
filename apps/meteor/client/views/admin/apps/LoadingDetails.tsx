import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const LoadingDetails: FC = () => (
	<Box display='flex' flexDirection='row' mbe='x20' w='full'>
		<Skeleton variant='rect' w='x120' h='x120' mie='x20' />
		<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
			<Skeleton variant='rect' w='full' h='x32' />
			<Skeleton variant='rect' w='full' h='x32' />
			<Skeleton variant='rect' w='full' h='x32' />
		</Box>
	</Box>
);

export default LoadingDetails;
