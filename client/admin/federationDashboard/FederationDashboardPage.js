import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
// import { usePolledMethodData } from '../../contexts/ServerContext';
import OverviewSection from './OverviewSection';

function FederationDashboardPage() {
	const t = useTranslation();
	// const [serversData, serversStatus] = usePolledMethodData('federation:getServers', [], 10000);

	return <Page>
		<Page.Header title={t('Federation_Dashboard')} />
		<Page.ScrollableContentWithShadow>
			<Box margin='x24'>
				<OverviewSection />
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default FederationDashboardPage;
