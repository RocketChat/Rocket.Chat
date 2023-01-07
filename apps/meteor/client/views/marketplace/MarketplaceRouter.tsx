import { useMethod, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';

const MarketplaceRouter = ({ children }: { children?: ReactNode }): ReactElement => {
	const currentContext = useRouteParameter('context') || 'all';
	const marketplaceRoute = useRoute('marketplace');
	const isAppsEngineEnabled = useMethod('apps/is-enabled');

	useEffect(() => {
		const initialize = async () => {
			// The currentContext === 'all' verification is for users who bookmarked
			// the old marketplace
			// TODO: Remove the all verification in the future;
			if ((await isAppsEngineEnabled()) && currentContext === 'all') {
				marketplaceRoute.replace({ context: 'explore', page: 'list' });
			}
		};

		initialize();
	}, [currentContext, isAppsEngineEnabled, marketplaceRoute]);

	useEffect(() => {
		SideNav.setFlex('marketplaceFlex');
		SideNav.openFlex(() => undefined);
	}, []);

	return <>{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}</>;
};

export default MarketplaceRouter;
