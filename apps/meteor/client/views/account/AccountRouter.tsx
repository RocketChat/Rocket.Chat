import { useCurrentRoute, useNavigate } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import SidebarPortal from '../../sidebar/SidebarPortal';
import AccountSidebar from './AccountSidebar';

type AccountRouterProps = {
	children?: ReactNode;
};

const AccountRouter = ({ children }: AccountRouterProps): ReactElement => {
	const [routeName] = useCurrentRoute();
	const navigate = useNavigate();

	useEffect(() => {
		if (routeName !== 'account-index') {
			return;
		}

		navigate('/account/profile', { replace: true });
	}, [routeName, navigate]);

	return children ? (
		<>
			<Suspense fallback={<PageSkeleton />}>{children}</Suspense>
			<SidebarPortal>
				<AccountSidebar />
			</SidebarPortal>
		</>
	) : (
		<PageSkeleton />
	);
};

export default AccountRouter;
