import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import { AgentsSection, ChannelsSection, DepartmentsSection, StatusSection, TagsSection } from './sections';

const ReportsPage = () => {
	const t = useTranslation();

	return (
		<Page background='tint'>
			<Page.Header title={t('Reports')} />
			<Box is='p' color='hint' fontScale='p2' mi={24}>
				{t('Omnichannel_Reports_Summary')}
			</Box>
			<Page.ScrollableContentWithShadow alignItems='center'>
				<Box display='flex' flexWrap='wrap' maxWidth='100rem' m={-8}>
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
