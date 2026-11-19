import Contextualbar, { type ContextualbarProps } from './Contextualbar.js';
import ContextualbarHeader from './ContextualbarHeader.js';
import { Box } from '../Box/index.js';
import { Skeleton } from '../Skeleton/index.js';

export type ContextualbarSkeletonProps = ContextualbarProps;

const ContextualbarSkeleton = (props: ContextualbarSkeletonProps) => (
	<Contextualbar {...props}>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<Box rcx-vertical-bar__skeleton>
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

export default ContextualbarSkeleton;
