import { Box, Grid, GridItem, Skeleton } from '@rocket.chat/fuselage';
import { memo } from 'react';

const SubscriptionPageSkeleton = () => (
	<Box marginBlock='none' marginInline='auto' width='full' color='default'>
		<Grid m={0}>
			<GridItem lg={4} xs={4} p={8}>
				<Skeleton variant='rect' width='full' height={240} />
			</GridItem>
			<GridItem lg={8} xs={4} p={8}>
				<Skeleton variant='rect' width='full' height={240} />
			</GridItem>
			<GridItem lg={6} xs={4} p={8}>
				<Skeleton variant='rect' width='full' height={240} />
			</GridItem>
			<GridItem lg={6} xs={4} p={8}>
				<Skeleton variant='rect' width='full' height={240} />
			</GridItem>
		</Grid>
	</Box>
);

export default memo(SubscriptionPageSkeleton);
