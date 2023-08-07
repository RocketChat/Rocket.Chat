import { Box, Flex } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import { DepartmentsSection } from './DepartmentsSection';
import { StatusSection } from './StatusSection';

const ReportsPage = () => {
	const t = useTranslation();

	return (
		<Page background='tint'>
			<Page.Header title={t('Reports')}></Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box display='flex' style={{ gap: '16px' }}>
					<Flex.Item grow={1} shrink={1} basis='50%'>
						<StatusSection />
					</Flex.Item>

					<Flex.Item grow={1} shrink={1} basis='50%'>
						<DepartmentsSection />
					</Flex.Item>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ReportsPage;
