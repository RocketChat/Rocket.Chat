import { Box, Skeleton } from '@rocket.chat/fuselage';

const AppDetailsPageLoading = () => (
	<Box display='flex' flexDirection='row' gap={32} marginBlockEnd={20} width='full'>
		<Skeleton variant='rect' width='x120' height='x120' />
		<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
			<Skeleton variant='rect' width='full' height='x32' />
			<Skeleton variant='rect' width='full' height='x32' />
			<Skeleton variant='rect' width='full' height='x32' />
		</Box>
	</Box>
);

export default AppDetailsPageLoading;
