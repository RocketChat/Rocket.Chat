import { Skeleton } from '@rocket.chat/fuselage';

import ContextualbarStatus from '../../../../../components/ContextualbarStatus';

const ThreadSkeleton = () => {
	return (
		<ContextualbarStatus>
			<Skeleton width='32px' height='32px' variant='rect' /> <Skeleton />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</ContextualbarStatus>
	);
};

export default ThreadSkeleton;
