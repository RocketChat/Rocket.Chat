import { Box, Skeleton, Tabs, TabsItem } from '@rocket.chat/fuselage';
import React from 'react';

import AppDetailsPageLayout from './AppDetailsPageLayout';

const SkeletonAppDetailsPage = () => {
	return (
		<AppDetailsPageLayout footerShown={false}>
			<Box display='flex' flexDirection='row' mbe={20} w='full'>
				<Skeleton variant='rect' w={124} h={124} mie={32} />
				<Box display='flex' flexDirection='column' justifyContent='space-between' flexGrow={1}>
					<Skeleton variant='rect' w='full' h={32} />
					<Skeleton variant='rect' w='full' h={32} />
					<Skeleton variant='rect' w='full' h={32} />
				</Box>
			</Box>

			<Tabs>
				<TabsItem disabled selected>
					<Skeleton variant='text' width={100} />
				</TabsItem>
				<TabsItem disabled>
					<Skeleton variant='text' width={100} />
				</TabsItem>
				<TabsItem disabled>
					<Skeleton variant='text' width={100} />
				</TabsItem>
			</Tabs>

			<Box display='flex' flexDirection='column'>
				<Skeleton variant='rect' width='full' maxWidth={640} height={0} pbe={`${(540 / 960) * 100}%`} mb={16} />
			</Box>
		</AppDetailsPageLayout>
	);
};

export default SkeletonAppDetailsPage;
