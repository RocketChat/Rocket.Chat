import { ContextualbarHeader, ContextualbarSkeletonContent, Skeleton } from '@rocket.chat/fuselage';

const ContextualbarSkeletonBody = () => (
	<>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<ContextualbarSkeletonContent />
	</>
);

export default ContextualbarSkeletonBody;
