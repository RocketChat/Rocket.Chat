import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import OverviewSection from './OverviewSection';
import ServersSection from './ServersSection';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

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
