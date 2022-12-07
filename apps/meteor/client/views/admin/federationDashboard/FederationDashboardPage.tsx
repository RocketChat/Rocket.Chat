import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import OverviewSection from './OverviewSection';
import ServersSection from './ServersSection';

function FederationDashboardPage(): ReactElement {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('Federation_Dashboard')} />
			<Page.ScrollableContentWithShadow>
				<Box margin='x24'>
					<OverviewSection />
					<ServersSection />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default FederationDashboardPage;
