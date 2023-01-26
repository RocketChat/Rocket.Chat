import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const AppRequestsLoading = (): ReactElement => {
	const loadingRows = Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height='x56' mbe='x8' width='100%' variant='rect' />);

	return (
		<>
			{loadingRows.map(() => (
				<Box display='flex' flexDirection='row' pb='x12' pie='x24' mbe='x9'>
					<Box is='section' mie='x8' mbs='x2' display='flex' flexDirection='row' alignItems='flex-start' h='full'>
						<Skeleton variant='rect' height='x36' width='x36' />
					</Box>
					<Box is='section' display='flex' flexDirection='column'>
						<Box display='flex' flexDirection='row' alignItems='flex-start' mbe='x4'>
							<Skeleton variant='rect' height='x16' width='x215' />
						</Box>
						<Skeleton variant='rect' height='x60' width='x516' />
					</Box>
				</Box>
			))}
		</>
	);
};

export default AppRequestsLoading;
