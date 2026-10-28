import { Skeleton, Stack } from '@rocket.chat/fuselage';

import AppsPageInset from './layout/AppsPageInset';

const AppsPageContentSkeleton = () => {
	const loadingSection = (
		<Stack gap='x20'>
			<Skeleton height='x28' width='x150' variant='rect' />
			<Stack gap='x8'>
				{Array.from({ length: 3 }, (_, i) => (
					<Skeleton key={i} height='x56' width='100%' variant='rect' />
				))}
			</Stack>
		</Stack>
	);
	return (
		<AppsPageInset>
			<Stack gap='x32'>
				{loadingSection}
				{loadingSection}
				{loadingSection}
			</Stack>
		</AppsPageInset>
	);
};

export default AppsPageContentSkeleton;
