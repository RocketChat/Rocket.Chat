import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import React, { Suspense, ReactElement, useEffect } from 'react';

import { SideNav } from '../../../app/ui-utils/client';
import PageSkeleton from '../../components/PageSkeleton';

const AccountRouter = ({ renderRoute }: { renderRoute: () => ReactElement }): ReactElement => {
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

	return renderRoute ? <Suspense fallback={<PageSkeleton />}>{renderRoute()}</Suspense> : <PageSkeleton />;
};

export default AccountRouter;
