import { Box } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { ResizeObserver } from './components/ResizeObserver';
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
			<Page.Header title={t('Reports')} />
			<Box is='p' color='hint' fontScale='p2' mi={24}>
				{t('Omnichannel_Reports_Summary')}
			</Box>
			<Page.ScrollableContentWithShadow alignItems='center'>
				<ResizeObserver>
					<Box display='flex' flexWrap='wrap' width='100rem' maxWidth='100%' m={-8}>
						<StatusSection />

						<ChannelsSection />

						<DepartmentsSection />

						<TagsSection />

						<AgentsSection />
					</Box>
				</ResizeObserver>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ReportsPage;
