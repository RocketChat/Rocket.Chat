import { Accordion, Box, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import Section from './Section';

const GroupPageSkeleton = () => (
	<Page>
		<PageHeader title={<Skeleton style={{ width: '20rem' }} />} />
		<PageContent>
			<Box style={useMemo(() => ({ margin: '0 auto', width: '100%', maxWidth: '590px' }), [])}>
				<Box is='p' color='hint' fontScale='p2'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>
				<Accordion className='page-settings'>
					<Section.Skeleton />
				</Accordion>
			</Box>
		</PageContent>
	</Page>
);

export default GroupPageSkeleton;
