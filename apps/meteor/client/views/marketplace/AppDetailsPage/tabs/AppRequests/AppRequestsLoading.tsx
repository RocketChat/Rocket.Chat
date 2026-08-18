import { Box, Skeleton } from '@rocket.chat/fuselage';

const AppRequestsLoading = () => {
	const appRequestsLoading = Array.from({ length: 5 }, (_, i) => (
		<Box key={i} display='flex' flexDirection='row' paddingBlock={12} paddingInlineEnd={24} marginBlockEnd={8}>
			<Box is='section' marginInlineEnd={8} marginBlockStart={2} display='flex' flexDirection='row' alignItems='flex-start' height='full'>
				<Skeleton variant='rect' height='x36' width='x36' />
			</Box>
			<Box is='section' display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='row' alignItems='flex-start' marginBlockEnd={4}>
					<Skeleton variant='rect' height='x16' width='x215' />
				</Box>
				<Skeleton variant='rect' height='x60' width='x516' />
			</Box>
		</Box>
	));

	return <>{appRequestsLoading}</>;
};

export default AppRequestsLoading;
