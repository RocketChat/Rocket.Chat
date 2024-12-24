import { Box, Skeleton } from '@rocket.chat/fuselage';

const AppDetailsPageLoading = () => (
	<Box display='flex' flexDirection='row' mbe={20} w='full'>
		<Skeleton variant='rect' w='x120' h='x120' mie={32} />
		<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
			<Skeleton variant='rect' w='full' h='x32' />
			<Skeleton variant='rect' w='full' h='x32' />
			<Skeleton variant='rect' w='full' h='x32' />
		</Box>
	</Box>
);

export default AppDetailsPageLoading;
