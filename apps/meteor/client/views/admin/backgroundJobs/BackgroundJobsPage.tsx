import { Tabs, TabsItem } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarHeader,
	ContextualbarTitle,
	Page,
	PageContent,
	PageHeader,
} from '@rocket.chat/ui-client';
import { useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BackgroundJobInfoContextualBar from './BackgroundJobInfoContextualBar';
import BackgroundJobsTable from './BackgroundJobsTable';

export type BackgroundJobsTab = 'system' | 'apps' | 'omnichannel';

const BackgroundJobsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const [tab, setTab] = useState<BackgroundJobsTab>('system');

	const handleClose = useCallback(() => {
		router.navigate({
			name: 'admin-background-jobs',
			params: {},
		});
	}, [router]);

	return (
		<Page flexDirection='row'>
			<Page name='admin-background-jobs'>
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
			{context && (
				<ContextualbarDialog onClose={handleClose}>
					<ContextualbarHeader>
						<ContextualbarTitle>{t('Job_Info')}</ContextualbarTitle>
						<ContextualbarClose onClick={handleClose} />
					</ContextualbarHeader>
					{context === 'info' && id && <BackgroundJobInfoContextualBar jobName={id} tab={tab} onClose={handleClose} />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default BackgroundJobsPage;
