import React, { lazy, useMemo, Suspense, useEffect, FC, ComponentType } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { SideNav } from '../../../app/ui-utils/client';

type OmnichannelRouterProps = {
	lazyRouteComponent: () => Promise<{ default: ComponentType }>;
};

const OmnichannelRouter: FC<OmnichannelRouterProps> = ({ lazyRouteComponent, ...props }) => {
	const LazyRouteComponent = useMemo(() => lazy(lazyRouteComponent), [lazyRouteComponent]);
	useEffect(() => {
		SideNav.setFlex('omnichannelFlex');
		SideNav.openFlex(() => undefined);
	}, []);

	return <Suspense fallback={<PageSkeleton />}>
		<LazyRouteComponent {...props} />
	</Suspense>;
};

export default OmnichannelRouter;
