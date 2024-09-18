import { useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { Page, PageContent } from '../../../components/Page';
import MarketplaceHeader from '../components/MarketplaceHeader';
import AppsPageContent from './AppsPageContent';

type AppsContext = 'explore' | 'installed' | 'premium' | 'private';

const AppsPage = (): ReactElement => {
	const t = useTranslation();

	const context = useRouteParameter('context') as AppsContext;

	const unsupportedVersion = useRef<boolean>(false);

	return (
		<Page background='tint'>
			<MarketplaceHeader unsupportedVersion={unsupportedVersion} title={t(`Apps_context_${context}`)} />
			<PageContent paddingInline='0'>
				<AppsPageContent unsupportedVersion={unsupportedVersion} />
			</PageContent>
		</Page>
	);
};

export default AppsPage;
