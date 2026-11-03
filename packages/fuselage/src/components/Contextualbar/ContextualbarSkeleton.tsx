import { memo } from 'react';

import { Box } from '../Box';
import { Skeleton } from '../Skeleton';
import Contextualbar, { type ContextualbarProps } from './Contextualbar';
import ContextualbarHeader from './ContextualbarHeader';

export type ContextualbarSkeletonProps = ContextualbarProps;

const ContextualbarSkeleton = (props: ContextualbarSkeletonProps) => (
	<Contextualbar {...props}>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<Box padding={24} display='flex' flexDirection='column' gap={4}>
			<Skeleton width='32px' height='32px' variant='rect' />
			<Box>
				{Array(5)
					.fill(5)
					.map((_, index) => (
						<Skeleton key={index} />
					))}
			</Box>
		</Box>
	</Contextualbar>
);

export default memo(ContextualbarSkeleton);
