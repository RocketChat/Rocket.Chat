import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { Suspense, ReactElement, ReactNode, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';

const MarketplaceRouter = ({ children }: { children?: ReactNode }): ReactElement => {
	const currentContext = useRouteParameter('context');
	const marketplaceRoute = useRoute('marketplace-all');

	useEffect(() => {
		if (!currentContext) {
			marketplaceRoute.replace({ context: 'all', page: 'list' });
		}
	}, [currentContext, marketplaceRoute]);

	return <>{children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />}</>;
};

export default MarketplaceRouter;
