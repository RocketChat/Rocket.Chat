import { Skeleton } from '@rocket.chat/fuselage';

import AppRequestRow from './layout/AppRequestRow';

const AppRequestsLoading = () => {
	const appRequestsLoading = Array.from({ length: 5 }, (_, i) => (
		<AppRequestRow key={i} leading={<Skeleton variant='rect' height='x36' width='x36' />}>
			<Skeleton variant='rect' height='x16' width='x215' />
			<Skeleton variant='rect' height='x60' width='x516' />
		</AppRequestRow>
	));

	return <>{appRequestsLoading}</>;
};

export default AppRequestsLoading;
