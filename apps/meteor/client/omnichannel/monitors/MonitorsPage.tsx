import React from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageContent } from '../../components/Page';
import MonitorsTable from './MonitorsTable';

const MonitorsPage = () => {
	const { t } = useTranslation();

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Livechat_Monitors')} />
				<PageContent>
					<MonitorsTable />
				</PageContent>
			</Page>
		</Page>
	);
};

export default MonitorsPage;
