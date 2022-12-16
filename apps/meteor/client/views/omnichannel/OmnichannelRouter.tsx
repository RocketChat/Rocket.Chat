import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { Suspense, useEffect } from 'react';

// import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';
import SidenavPortal from '../../sidebar/SidenavPortal';
import OminichannelSidebar from './sidebar/OmnichannelSidebar';

type OmnichannelRouterProps = {
	children?: ReactNode;
};

const OmnichannelRouter = ({ children }: OmnichannelRouterProps): ReactElement => {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('omnichannel-current-chats');

	useEffect(() => {
		if (routeName === 'omnichannel-index') {
			defaultRoute.push();
		}
	}, [defaultRoute, routeName]);

	return children ? (
		<Suspense fallback={<PageSkeleton />}>
			<>
				<SidenavPortal>
					<OminichannelSidebar />
				</SidenavPortal>
				{children}
			</>
		</Suspense>
	) : (
		<PageSkeleton />
	);
};

export default OmnichannelRouter;
