import { useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import MarketplaceHeaderComponent from '../components/MarketplaceHeaderComponent';
import AppsPageContent from './AppsPageContent';

type HeaderTitle = 'Explore' | 'Enterprise' | 'Installed' | 'Private Apps' | 'Apps';

const getTitle = (context: string): HeaderTitle => {
	switch (context) {
		case 'explore':
			return 'Explore';
		case 'enterprise':
			return 'Enterprise';
		case 'installed':
			return 'Installed';
		case 'private':
			return 'Private Apps';
	}

	return 'Apps';
};

const AppsPage = (): ReactElement => {
	const t = useTranslation();
	const context = useRouteParameter('context');

	return (
		<Page background='tint'>
			{context && <MarketplaceHeaderComponent title={t(getTitle(context))} />}
			<Page.Content>
				<AppsPageContent />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
