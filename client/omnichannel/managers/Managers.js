import React from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import ManagersTable from './ManagersTable';

function Managers() {
	const t = useTranslation();

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Managers')}>
			</Page.Header>
			<Page.Content>
				<ManagersTable />
			</Page.Content>
		</Page>
	</Page>;
}

export default Managers;
