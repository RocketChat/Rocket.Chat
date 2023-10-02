import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import MonitorsTable from './MonitorsTable';

const MonitorsPage = () => {
	const t = useTranslation();

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Livechat_Monitors')} />
				<Page.Content>
					<MonitorsTable />
				</Page.Content>
			</Page>
		</Page>
	);
};

export default MonitorsPage;
