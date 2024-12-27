import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const AppRequestsLoading = (): ReactElement => {
	const appRequestsLoading = Array.from({ length: 5 }, (_, i) => (
		<Box key={i} display='flex' flexDirection='row' pb={12} pie={24} mbe={8}>
			<Box is='section' mie={8} mbs={2} display='flex' flexDirection='row' alignItems='flex-start' h='full'>
				<Skeleton variant='rect' height='x36' width='x36' />
			</Box>
			<Box is='section' display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='flex-start' mbe={4}>
					<Skeleton variant='rect' height='x16' width='x215' />
				</Box>
				<Skeleton variant='rect' height='x60' width='x516' />
			</Box>
		</Box>
	));

	return <>{appRequestsLoading}</>;
};

export default AppRequestsLoading;
