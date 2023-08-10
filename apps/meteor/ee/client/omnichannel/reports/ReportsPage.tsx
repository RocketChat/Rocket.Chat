import { Box, Flex } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import { AgentsSection, ChannelsSection, DepartmentsSection, StatusSection, TagsSection } from './sections';

const ReportsPage = () => {
	const t = useTranslation();

	return (
		<Page background='tint'>
			<Page.Header title={t('Reports')}></Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box display='flex' flexWrap='wrap' margin={-8}>
					<StatusSection />

					<ChannelsSection />

					<DepartmentsSection />

					<TagsSection />

					<AgentsSection />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ReportsPage;
