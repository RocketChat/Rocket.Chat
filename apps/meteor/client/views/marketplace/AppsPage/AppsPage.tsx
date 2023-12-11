import { useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { Page, PageContent } from '../../../components/Page';
import MarketplaceHeader from '../components/MarketplaceHeader';
import AppsPageContent from './AppsPageContent';

type AppsContext = 'explore' | 'installed' | 'premium' | 'private';

const AppsPage = (): ReactElement => {
	const t = useTranslation();

	const context = useRouteParameter('context') as AppsContext;

	return (
		<Page background='tint'>
			<MarketplaceHeader title={t(`Apps_context_${context}`)} />
			<PageContent paddingInline='0'>
				<AppsPageContent />
			</PageContent>
		</Page>
	);
};

export default AppsPage;
