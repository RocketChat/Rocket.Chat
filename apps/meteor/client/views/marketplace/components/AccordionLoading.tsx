import { Skeleton, Stack } from '@rocket.chat/fuselage';

const SKELETON_ITEMS = 3;

const AccordionLoading = () => (
	<Stack gap='x8'>
		{Array.from({ length: SKELETON_ITEMS }, (_v, k) => (
			<Skeleton key={k} variant='rect' height='80px' />
		))}
	</Stack>
);

export default AccordionLoading;
