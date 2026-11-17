import { Box, Skeleton } from '@rocket.chat/fuselage';

const SKELETON_ITEMS = 3;

const AccordionLoading = () => (
	<Box display='flex' flexDirection='column' gap='x8' padding='x4'>
		{Array.from({ length: SKELETON_ITEMS }, (_v, k) => (
			<Skeleton key={k} variant='rect' height='80px' />
		))}
	</Box>
);

export default AccordionLoading;
