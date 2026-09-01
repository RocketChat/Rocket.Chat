import type { OmnichannelJobSource } from '@rocket.chat/core-typings';
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
import RecentHistoryTable from './RecentHistoryTable';

export type BackgroundJobsTab = 'history' | 'system' | 'apps' | 'omnichannel';

const BackgroundJobsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const tab = (useRouteParameter('tab') as BackgroundJobsTab) || 'history';
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const [omnichannelSource, setOmnichannelSource] = useState<OmnichannelJobSource>('auto-close');

	const handleClose = useCallback(() => {
		router.navigate({
			name: 'admin-background-jobs',
			params: {},
		});
	}, [router]);

	const handleTabChange = (nextTab: BackgroundJobsTab): void => {
		router.navigate({
			name: 'admin-background-jobs',
			params: { tab: nextTab },
		});
		if (nextTab === 'omnichannel') {
			setOmnichannelSource('auto-close');
		}
	};

	return (
		<Page flexDirection='row'>
			<Page name='admin-background-jobs'>
				<PageHeader title={t('Background_Jobs')} />
				<Tabs>
					<TabsItem selected={tab === 'history'} onClick={() => handleTabChange('history')}>
						{t('Recent_History')}
					</TabsItem>
					<TabsItem selected={tab === 'system'} onClick={() => handleTabChange('system')}>
						{t('System')}
					</TabsItem>
					<TabsItem selected={tab === 'apps'} onClick={() => handleTabChange('apps')}>
						{t('Apps')}
					</TabsItem>
					<TabsItem selected={tab === 'omnichannel'} onClick={() => handleTabChange('omnichannel')}>
						{t('Omnichannel')}
					</TabsItem>
				</Tabs>
				{tab === 'omnichannel' && (
					<Tabs paddingBlockStart={8} flexShrink={0}>
						<TabsItem fontScale='p2' selected={omnichannelSource === 'auto-close'} onClick={() => setOmnichannelSource('auto-close')}>
							{t('Background_Jobs_Omnichannel_Auto_Close_On_Hold')}
						</TabsItem>
						<TabsItem fontScale='p2' selected={omnichannelSource === 'auto-transfer'} onClick={() => setOmnichannelSource('auto-transfer')}>
							{t('Background_Jobs_Omnichannel_Auto_Transfer')}
						</TabsItem>
						<TabsItem
							fontScale='p2'
							selected={omnichannelSource === 'queue-inactivity'}
							onClick={() => setOmnichannelSource('queue-inactivity')}
						>
							{t('Background_Jobs_Omnichannel_Queue_Inactivity')}
						</TabsItem>
					</Tabs>
				)}
				<PageContent>
					{tab === 'history' ? <RecentHistoryTable /> : <BackgroundJobsTable tab={tab} omnichannelSource={omnichannelSource} />}
				</PageContent>
			</Page>
			{context && tab !== 'history' && (
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
