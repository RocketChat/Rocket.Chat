import { Skeleton } from '@rocket.chat/fuselage';

import AppDetailsHeaderLayout from './layout/AppDetailsHeaderLayout';

const AppDetailsPageLoading = () => (
	<AppDetailsHeaderLayout avatar={<Skeleton variant='rect' width='x120' height='x120' />} spread>
		<Skeleton variant='rect' width='full' height='x32' />
		<Skeleton variant='rect' width='full' height='x32' />
		<Skeleton variant='rect' width='full' height='x32' />
	</AppDetailsHeaderLayout>
);

export default AppDetailsPageLoading;
