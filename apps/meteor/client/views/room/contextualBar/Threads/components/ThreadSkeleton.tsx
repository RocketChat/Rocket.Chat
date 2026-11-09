import { Skeleton } from '@rocket.chat/fuselage';

import ContextualbarInset from '../../layout/ContextualbarInset';

const ThreadSkeleton = () => {
	return (
		<ContextualbarInset>
			<Skeleton width='32px' height='32px' variant='rect' /> <Skeleton />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</ContextualbarInset>
	);
};

export default ThreadSkeleton;
