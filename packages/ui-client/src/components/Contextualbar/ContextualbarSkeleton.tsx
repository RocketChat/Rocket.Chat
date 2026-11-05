import ContextualbarDialog from './ContextualbarDialog.js';
import ContextualbarSkeletonBody from './ContextualbarSkeletonBody.js';

const ContextualbarSkeleton = ({ onClose }: { onClose?: () => void }) => (
	<ContextualbarDialog onClose={onClose}>
		<ContextualbarSkeletonBody />
	</ContextualbarDialog>
);

export default ContextualbarSkeleton;
