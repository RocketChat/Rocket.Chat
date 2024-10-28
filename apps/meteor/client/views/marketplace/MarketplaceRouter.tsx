import { useAtLeastOnePermission, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import MarketPlaceSidebar from './MarketplaceSidebar';
import PageSkeleton from '../../components/PageSkeleton';
import SidebarPortal from '../../sidebar/SidebarPortal';
import NotFoundPage from '../notFound/NotFoundPage';

type MarketplaceRouterProps = {
	children?: ReactNode;
};

const MarketplaceRouter = ({ children }: MarketplaceRouterProps) => {
	const router = useRouter();
	const context = useRouteParameter('context');

	useEffect(() => {
		if (context === 'details') {
			router.navigate(
				{
					name: 'marketplace',
					params: { ...router.getRouteParameters(), context: 'explore', tab: 'details' },
				},
				{ replace: true },
			);
		}

		if (context === 'all') {
			router.navigate(
				{
					name: 'marketplace',
					params: { context: 'explore', page: 'list' },
				},
				{ replace: true },
			);
		}
	}, [context, router]);

	const canAccessMarketplace = useAtLeastOnePermission(['access-marketplace', 'manage-apps']);

	if (!canAccessMarketplace) {
		return <NotFoundPage />;
	}

	return children ? (
		<>
			<Suspense fallback={<PageSkeleton />}>{children}</Suspense>
			<SidebarPortal>
				<MarketPlaceSidebar />
			</SidebarPortal>
		</>
	) : (
		<PageSkeleton />
	);
};

export default MarketplaceRouter;
