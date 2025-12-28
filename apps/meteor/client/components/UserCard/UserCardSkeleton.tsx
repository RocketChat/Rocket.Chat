import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import UserCardDialog from './UserCardDialog';

const UserCardSkeleton = (props: ComponentProps<typeof UserCardDialog>) => {
	return (
		<UserCardDialog {...props}>
			<Box>
				<Skeleton borderRadius='x4' width='x124' height='x124' variant='rect' />
				<Box flexGrow={0} display='flex' mbs={12} alignItems='center' justifyContent='center'>
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} variant='rect' height='x28' width='x28' borderRadius='x4' mi={2} />
					))}
				</Box>
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis={16} width='1px'>
				<Box mbe={4} withTruncatedText display='flex' alignItems='center'>
					<Skeleton width='100%' />
				</Box>
				<Skeleton width='100%' />
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} flexGrow={1} mi={2} />
				))}
				{Array.from({ length: 2 }).map((_, i) => (
					<Skeleton key={i} width='100%' />
				))}
			</Box>
		</UserCardDialog>
	);
};

export default UserCardSkeleton;
