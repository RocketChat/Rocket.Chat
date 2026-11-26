import { Skeleton } from '../Skeleton';
import Contextualbar, { type ContextualbarProps } from './Contextualbar';
import ContextualbarHeader from './ContextualbarHeader';
import ContextualbarSkeletonContent from './ContextualbarSkeletonContent';

export type ContextualbarSkeletonProps = ContextualbarProps;

const ContextualbarSkeleton = (props: ContextualbarSkeletonProps) => (
	<Contextualbar {...props}>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<ContextualbarSkeletonContent />
	</Contextualbar>
);

export default ContextualbarSkeleton;
