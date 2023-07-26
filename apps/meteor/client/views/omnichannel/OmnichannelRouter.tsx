import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import SidebarPortal from '../../sidebar/SidebarPortal';
import OmnichannelSidebar from './sidebar/OmnichannelSidebar';

type OmnichannelRouterProps = {
	children?: ReactNode;
};

const OmnichannelRouter = ({ children }: OmnichannelRouterProps): ReactElement => {
	const router = useRouter();

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				if (router.getRouteName() !== 'omnichannel-index') {
					return;
				}

				router.navigate({ name: 'omnichannel-current-chats' }, { replace: true });
			}),
		[router],
	);

	if (!children) {
		return <PageSkeleton />;
	}

	return (
		<>
			<Suspense fallback={<PageSkeleton />}>{children}</Suspense>
			<SidebarPortal>
				<OmnichannelSidebar />
			</SidebarPortal>
		</>
	);
};

export default OmnichannelRouter;
