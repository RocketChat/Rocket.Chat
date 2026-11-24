import { Skeleton, Stack } from '@rocket.chat/fuselage';

const AppDetailsPageLoading = () => (
	<Stack direction='row' gap='x32'>
		<Skeleton variant='rect' width='x120' height='x120' />
		<Stack grow justify='space-between'>
			<Skeleton variant='rect' width='full' height='x32' />
			<Skeleton variant='rect' width='full' height='x32' />
			<Skeleton variant='rect' width='full' height='x32' />
		</Stack>
	</Stack>
);

export default AppDetailsPageLoading;
