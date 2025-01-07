import { Accordion, Box, Skeleton } from '@rocket.chat/fuselage';
import { useMemo } from 'react';

import { Page, PageHeader, PageContent } from '../../../../components/Page';
import SettingsSectionSkeleton from '../SettingsSection/SettingsSectionSkeleton';

const SettingsGroupPageSkeleton = () => (
	<Page>
		<PageHeader title={<Skeleton style={{ width: '20rem' }} />} />
		<PageContent>
			<Box style={useMemo(() => ({ margin: '0 auto', width: '100%', maxWidth: '590px' }), [])}>
				<Box is='p' color='hint' fontScale='p2'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
				<Accordion>
					<SettingsSectionSkeleton />
				</Accordion>
			</Box>
		</PageContent>
	</Page>
);

export default SettingsGroupPageSkeleton;
