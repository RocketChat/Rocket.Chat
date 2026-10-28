import { CardGrid, CardGridItem, Skeleton } from '@rocket.chat/fuselage';
import { memo } from 'react';

import SubscriptionContent from './layout/SubscriptionContent';
import SubscriptionInset from './layout/SubscriptionInset';

const SubscriptionPageSkeleton = () => (
	<SubscriptionContent>
		<SubscriptionInset>
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
		</SubscriptionInset>
	</SubscriptionContent>
);

export default memo(SubscriptionPageSkeleton);
