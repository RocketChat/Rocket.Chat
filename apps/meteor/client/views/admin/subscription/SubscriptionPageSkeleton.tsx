import { Box, CardGrid, CardGridItem, Skeleton } from '@rocket.chat/fuselage';
import { memo } from 'react';

const SubscriptionPageSkeleton = () => (
	<Box marginBlock='none' marginInline='auto' width='full' color='default' padding={8}>
		<CardGrid>
			<CardGridItem lg={4} xs={4}>
				<Skeleton variant='rect' width='full' height={240} />
			</CardGridItem>
			<CardGridItem lg={8} xs={4}>
				<Skeleton variant='rect' width='full' height={240} />
			</CardGridItem>
			<CardGridItem lg={6} xs={4}>
				<Skeleton variant='rect' width='full' height={240} />
			</CardGridItem>
			<CardGridItem lg={6} xs={4}>
				<Skeleton variant='rect' width='full' height={240} />
			</CardGridItem>
		</CardGrid>
	</Box>
);

export default memo(SubscriptionPageSkeleton);
