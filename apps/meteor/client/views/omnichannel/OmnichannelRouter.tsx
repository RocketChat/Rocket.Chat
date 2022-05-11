import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactNode, Suspense, useEffect, FC } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';

type OmnichannelRouterProps = {
	renderRoute?: () => ReactNode;
};

const OmnichannelRouter: FC<OmnichannelRouterProps> = ({ renderRoute }) => {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('omnichannel-current-chats');
	useEffect(() => {
		if (routeName === 'omnichannel-index') {
			defaultRoute.push();
		}
	}, [defaultRoute, routeName]);

	useEffect(() => {
		SideNav.setFlex('omnichannelFlex');
		SideNav.openFlex(() => undefined);
	}, []);

	return renderRoute ? <Suspense fallback={<PageSkeleton />}>{renderRoute()}</Suspense> : <PageSkeleton />;
};

export default OmnichannelRouter;
