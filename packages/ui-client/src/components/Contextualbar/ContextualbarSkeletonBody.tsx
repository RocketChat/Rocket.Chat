import { Box, Skeleton } from '@rocket.chat/fuselage';

import ContextualbarHeader from './ContextualbarHeader';

const ContextualbarSkeletonBody = () => (
	<>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<Box padding={24}>
			<Skeleton marginBlockEnd={4} width='x32' height='x32' variant='rect' />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</Box>
	</>
);

export default ContextualbarSkeletonBody;
