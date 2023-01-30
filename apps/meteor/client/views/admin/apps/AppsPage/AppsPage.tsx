import { Tabs } from '@rocket.chat/fuselage';
import { useRoute, useTranslation, useCurrentRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../../components/Page';
import AppsPageContent from './AppsPageContent';

const AppsPage = (): ReactElement => {
	const t = useTranslation();

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);

	const context = useRouteParameter('context');

	const handleMarketplaceTabClick = (): void => router.push({ context: 'all', page: 'list' });

	const handleInstalledTabClick = (): void => router.push({ context: 'installed', page: 'list' });

	return (
		<Page background='tint'>
			<Page.Header title={t('Apps')} />
			<Tabs>
				<Tabs.Item onClick={handleMarketplaceTabClick} selected={context === 'all'}>
					{t('Marketplace')}
				</Tabs.Item>
				<Tabs.Item onClick={handleInstalledTabClick} selected={context === 'installed'}>
					{t('Installed')}
				</Tabs.Item>
			</Tabs>
			<Page.Content overflowY='auto'>
				<AppsPageContent />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
