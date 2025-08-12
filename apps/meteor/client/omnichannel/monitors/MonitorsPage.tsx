import { useTranslation } from 'react-i18next';

import MonitorsTable from './MonitorsTable';
import { Page, PageHeader, PageContent } from '../../components/Page';

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
