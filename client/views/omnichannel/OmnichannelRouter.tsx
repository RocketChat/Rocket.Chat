import React, { lazy, useMemo, Suspense, useEffect, FC, ComponentType } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';

type OmnichannelRouterProps = {
	lazyRouteComponent: () => Promise<{ default: ComponentType }>;
};

const OmnichannelRouter: FC<OmnichannelRouterProps> = ({ lazyRouteComponent, ...props }) => {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('omnichannel-current-chats');
	useEffect(() => {
		if (routeName === 'omnichannel-index') {
			defaultRoute.push();
		}
	}, [defaultRoute, routeName]);

	const LazyRouteComponent = useMemo(() => (lazyRouteComponent ? lazy(lazyRouteComponent) : null), [
		lazyRouteComponent,
	]);

	useEffect(() => {
		SideNav.setFlex('omnichannelFlex');
		SideNav.openFlex(() => undefined);
	}, []);

	return LazyRouteComponent ? (
		<Suspense fallback={<PageSkeleton />}>
			<LazyRouteComponent {...props} />
		</Suspense>
	) : (
		<PageSkeleton />
	);
};

export default OmnichannelRouter;
