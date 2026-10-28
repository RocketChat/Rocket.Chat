import { Skeleton } from '@rocket.chat/fuselage';

import LoadingList from './layout/LoadingList';

const SKELETON_ITEMS = 3;

const AccordionLoading = () => (
	<LoadingList>
		{Array.from({ length: SKELETON_ITEMS }, (_v, k) => (
			<Skeleton key={k} variant='rect' height='80px' />
		))}
	</LoadingList>
);

export default AccordionLoading;
