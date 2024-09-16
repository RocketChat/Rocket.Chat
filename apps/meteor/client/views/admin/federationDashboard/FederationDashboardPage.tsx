import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import OverviewSection from './OverviewSection';
import ServersSection from './ServersSection';

function FederationDashboardPage(): ReactElement {
	const { t } = useTranslation();

	return (
		<Page>
			<PageHeader title={t('Federation')} />
			<PageScrollableContentWithShadow>
				<Box margin={24}>
					<OverviewSection />
					<ServersSection />
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
}

export default FederationDashboardPage;
