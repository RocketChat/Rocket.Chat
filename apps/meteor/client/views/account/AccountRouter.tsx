import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';

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

	useEffect(() => {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex(() => undefined);
	}, []);

	return children ? <Suspense fallback={<PageSkeleton />}>{children}</Suspense> : <PageSkeleton />;
};

export default AccountRouter;
