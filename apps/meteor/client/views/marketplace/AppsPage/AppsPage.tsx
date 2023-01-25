import { useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import MarketplaceHeader from '../components/MarketplaceHeader';
import AppsPageContent from './AppsPageContent';

type AppsContext = 'explore' | 'installed' | 'enterprise' | 'private';

const AppsPage = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');

	return (
		<Page background='tint'>
			{context && <MarketplaceHeader title={t(`Apps_context_${context as AppsContext}`)} />}
			<Page.Content>
				<AppsPageContent />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
