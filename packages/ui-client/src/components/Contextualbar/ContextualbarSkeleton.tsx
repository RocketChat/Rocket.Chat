import ContextualbarDialog from './ContextualbarDialog';
import ContextualbarSkeletonBody from './ContextualbarSkeletonBody';

export type ContextualbarSkeletonProps = {
	onClose?: () => void;
};

const ContextualbarSkeleton = ({ onClose }: ContextualbarSkeletonProps) => (
	<ContextualbarDialog onClose={onClose}>
		<ContextualbarSkeletonBody />
	</ContextualbarDialog>
);

export default ContextualbarSkeleton;
