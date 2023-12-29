import { Box, CardGrid } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../../client/components/Page';
import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { AgentsSection, ChannelsSection, DepartmentsSection, StatusSection, TagsSection } from './sections';

const ReportsPage = () => {
	const t = useTranslation();

	const hasPermission = usePermission('view-livechat-reports');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');

	if (!hasPermission || !isEnterprise) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page background='tint'>
			<PageHeader title={t('Reports')} />
			<Box is='p' color='hint' fontScale='p2' mi={24}>
				{t('Omnichannel_Reports_Summary')}
			</Box>
			<PageScrollableContentWithShadow alignItems='center'>
				<CardGrid breakpoints={{ xs: 4, sm: 8, md: 8, lg: 12, xl: 6 }}>
					<StatusSection />
					<ChannelsSection />
					<DepartmentsSection />
					<TagsSection />
					<AgentsSection />
				</CardGrid>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default ReportsPage;
