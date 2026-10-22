import { Box, Skeleton } from '@rocket.chat/fuselage';

const SKELETON_ITEMS = 3;

const AccordionLoading = () => (
	<Box display='flex' flexDirection='column' gap={4} padding={2}>
		{Array.from({ length: SKELETON_ITEMS }, (_v, k) => (
			<Skeleton key={k} variant='rect' height='80px' />
		))}
	</Box>
);

export default AccordionLoading;
