import { Box, Skeleton } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useMemo } from 'react';

import SettingsSectionSkeleton from '../SettingsSection/SettingsSectionSkeleton';

const SettingsGroupPageSkeleton = () => (
	<Page>
		<PageHeader title={<Skeleton style={{ width: '20rem' }} />} />
		<PageContent>
			<Box style={useMemo(() => ({ margin: '0 auto', width: '100%', maxWidth: '600px' }), [])}>
				<Box is='p' color='hint' fontScale='p2' mbe={24}>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
				<SettingsSectionSkeleton />
			</Box>
		</PageContent>
	</Page>
);

export default SettingsGroupPageSkeleton;
