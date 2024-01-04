import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

const GenericResourceUsageSkeleton = ({ title, ...props }: { title?: string }) => {
	return (
		<Box w='x180' h='x40' mi={8} fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around' {...props}>
			{title ? <Box color='default'>{title}</Box> : <Skeleton w='full' />}
			<Skeleton w='full' />
		</Box>
	);
};

export default GenericResourceUsageSkeleton;
