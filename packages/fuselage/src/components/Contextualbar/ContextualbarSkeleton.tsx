import { memo } from 'react';

import { Box, type BoxProps } from '../Box';
import { Skeleton } from '../Skeleton';
import Contextualbar from './Contextualbar';
import ContextualbarHeader from './ContextualbarHeader';

export type ContextualbarSkeletonProps = BoxProps;

const ContextualbarSkeleton = (props: ContextualbarSkeletonProps) => (
	<Contextualbar {...props}>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<Box padding={24}>
			<Skeleton marginBlockEnd={4} width='32px' height='32px' variant='rect' />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</Box>
	</Contextualbar>
);

export default memo(ContextualbarSkeleton);
