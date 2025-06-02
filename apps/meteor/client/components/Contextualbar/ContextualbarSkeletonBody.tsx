import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import ContextualbarHeader from './ContextualbarHeader';

const ContextualbarSkeletonBody = (): ReactElement => (
	<>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<Box p={24}>
			<Skeleton mbe={4} width='32px' height='32px' variant='rect' />
			{Array(5)
				.fill(5)
				.map((_, index) => (
					<Skeleton key={index} />
				))}
		</Box>
	</>
);

export default ContextualbarSkeletonBody;
