import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import { Page, PageContent, PageHeader } from '@rocket.chat/ui-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BackgroundJobsTable from './BackgroundJobsTable';

export type BackgroundJobsTab = 'system' | 'apps' | 'omnichannel';

const BackgroundJobsPage = () => {
	const { t } = useTranslation();

	const [tab, setTab] = useState<BackgroundJobsTab>('system');
	return (
		<Page>
			<PageHeader title={t('Background_Jobs')} />
			<Tabs>
				<TabsItem selected={tab === 'system'} onClick={() => setTab('system')}>
					{t('System')}
				</TabsItem>
				<TabsItem selected={tab === 'apps'} onClick={() => setTab('apps')}>
					{t('Apps')}
				</TabsItem>
				<TabsItem selected={tab === 'omnichannel'} onClick={() => setTab('omnichannel')}>
					{t('Omnichannel')}
				</TabsItem>
			</Tabs>
			<PageContent>
				<BackgroundJobsTable tab={tab} />
			</PageContent>
		</Page>
	);
};

export default BackgroundJobsPage;
