import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import UserCardDialog from './UserCardDialog';

const UserCardSkeleton = (props: ComponentProps<typeof UserCardDialog>) => {
	return (
		<UserCardDialog {...props}>
			<Box display='flex' alignItems='center'>
				<Skeleton borderRadius='x4' width='x36' height='x36' variant='rect' />
				<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} marginInlineStart='x4'>
					<Skeleton width='50%' />
					<Skeleton width='75%' />
				</Box>
			</Box>
			<Box display='flex' flexDirection='column' marginBlockStart='x18'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} width='100%' />
				))}
			</Box>
			<Box display='flex' marginBlockStart='x24'>
				<Skeleton variant='rect' height='x32' flexGrow={1} borderRadius='x4' marginInlineEnd='x8' />
				<Skeleton variant='rect' height='x32' flexGrow={1} borderRadius='x4' marginInlineEnd='x8' />
				<Skeleton variant='rect' height='x32' width='x32' borderRadius='x4' />
			</Box>
		</UserCardDialog>
	);
};

export default UserCardSkeleton;
