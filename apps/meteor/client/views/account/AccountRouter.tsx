import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

// import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';
import SidenavPortal from '../../sidebar/SidenavPortal';
import AccountSidebar from './AccountSidebar';

type AccountRouterProps = {
	children?: ReactNode;
};

const AccountRouter = ({ children }: AccountRouterProps): ReactElement => {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('profile');

	useEffect(() => {
		if (routeName !== 'account-index') {
			return;
		}

		defaultRoute.replace();
	}, [routeName, defaultRoute]);

	return children ? (
		<>
			<Suspense fallback={<PageSkeleton />}>{children}</Suspense>
			<SidenavPortal>
				<AccountSidebar />
			</SidenavPortal>
		</>
	) : (
		<PageSkeleton />
	);
};

export default AccountRouter;
