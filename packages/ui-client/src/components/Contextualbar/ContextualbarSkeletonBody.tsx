import { Box, ContextualbarHeader, Skeleton } from '@rocket.chat/fuselage';

const ContextualbarSkeletonBody = () => (
	<>
		<ContextualbarHeader>
			<Skeleton width='100%' />
		</ContextualbarHeader>
		<Box padding={24} display='flex' flexDirection='column' gap={4}>
			<Skeleton width='x32' height='x32' variant='rect' />
			<Box>
				{Array(5)
					.fill(5)
					.map((_, index) => (
						<Skeleton key={index} />
					))}
			</Box>
		</Box>
	</>
);

export default ContextualbarSkeletonBody;
